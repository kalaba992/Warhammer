import type { ClassificationResult } from '@/types'

export interface CachedClassification {
  productDescription: string
  normalizedDescription: string
  result: ClassificationResult
  timestamp: number
  usageCount: number
  lastUsed: number
}

export interface SimilarityMatch {
  cached: CachedClassification
  similarity: number
}

const getKvStore = () => window.spark?.kv

const SIMILARITY_THRESHOLD = 0.85
const CACHE_MAX_SIZE = 500
const CACHE_EXPIRY_DAYS = 90

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' '))
  const words2 = new Set(text2.split(' '))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  if (union.size === 0) return 0
  
  const jaccardSimilarity = intersection.size / union.size
  
  const levenshteinDistance = getLevenshteinDistance(text1, text2)
  const maxLength = Math.max(text1.length, text2.length)
  const levenshteinSimilarity = maxLength > 0 ? 1 - levenshteinDistance / maxLength : 0
  
  return (jaccardSimilarity * 0.6) + (levenshteinSimilarity * 0.4)
}

function getLevenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

export async function getCachedClassification(
  productDescription: string
): Promise<CachedClassification | null> {
  try {
    const kv = getKvStore()
    if (!kv) return null

    const cacheData = await kv.get<CachedClassification[]>('classification-cache')
    if (!cacheData || cacheData.length === 0) return null
    
    const normalized = normalizeText(productDescription)
    
    const exactMatch = cacheData.find(
      item => item.normalizedDescription === normalized
    )
    
    if (exactMatch) {
      await updateCacheUsage(exactMatch.productDescription)
      return exactMatch
    }
    
    return null
  } catch (error) {
    console.error('Error retrieving cached classification:', error)
    return null
  }
}

export async function findSimilarClassifications(
  productDescription: string,
  limit: number = 5
): Promise<SimilarityMatch[]> {
  try {
    const kv = getKvStore()
    if (!kv) return []

    const cacheData = await kv.get<CachedClassification[]>('classification-cache')
    if (!cacheData || cacheData.length === 0) return []
    
    const normalized = normalizeText(productDescription)
    
    const validCache = cacheData.filter(item => {
      const age = Date.now() - item.timestamp
      const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      return age < expiryMs
    })
    
    const matches: SimilarityMatch[] = validCache
      .map(cached => ({
        cached,
        similarity: calculateSimilarity(normalized, cached.normalizedDescription)
      }))
      .filter(match => match.similarity >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
    
    return matches
  } catch (error) {
    console.error('Error finding similar classifications:', error)
    return []
  }
}

export async function cacheClassification(
  productDescription: string,
  result: ClassificationResult
): Promise<void> {
  try {
    const kv = getKvStore()
    if (!kv) return

    const cacheData = await kv.get<CachedClassification[]>('classification-cache') || []
    
    const normalized = normalizeText(productDescription)
    
    const existingIndex = cacheData.findIndex(
      item => item.normalizedDescription === normalized
    )
    
    if (existingIndex !== -1) {
      cacheData[existingIndex] = {
        ...cacheData[existingIndex],
        result,
        usageCount: cacheData[existingIndex].usageCount + 1,
        lastUsed: Date.now()
      }
    } else {
      const newEntry: CachedClassification = {
        productDescription,
        normalizedDescription: normalized,
        result,
        timestamp: Date.now(),
        usageCount: 1,
        lastUsed: Date.now()
      }
      
      cacheData.unshift(newEntry)
      
      if (cacheData.length > CACHE_MAX_SIZE) {
        cacheData.sort((a, b) => {
          const scoreA = a.usageCount * 0.6 + (Date.now() - a.lastUsed) * -0.4
          const scoreB = b.usageCount * 0.6 + (Date.now() - b.lastUsed) * -0.4
          return scoreB - scoreA
        })
        
        cacheData.splice(CACHE_MAX_SIZE)
      }
    }
    
    await kv.set('classification-cache', cacheData)
  } catch (error) {
    console.error('Error caching classification:', error)
  }
}

async function updateCacheUsage(productDescription: string): Promise<void> {
  try {
    const kv = getKvStore()
    if (!kv) return

    const cacheData = await kv.get<CachedClassification[]>('classification-cache')
    if (!cacheData) return
    
    const normalized = normalizeText(productDescription)
    const index = cacheData.findIndex(item => item.normalizedDescription === normalized)
    
    if (index !== -1) {
      cacheData[index].usageCount += 1
      cacheData[index].lastUsed = Date.now()
      await kv.set('classification-cache', cacheData)
    }
  } catch (error) {
    console.error('Error updating cache usage:', error)
  }
}

export async function clearExpiredCache(): Promise<number> {
  try {
    const kv = getKvStore()
    if (!kv) return 0

    const cacheData = await kv.get<CachedClassification[]>('classification-cache')
    if (!cacheData || cacheData.length === 0) return 0
    
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const initialCount = cacheData.length
    
    const validCache = cacheData.filter(item => {
      const age = Date.now() - item.timestamp
      return age < expiryMs
    })
    
    await kv.set('classification-cache', validCache)
    
    return initialCount - validCache.length
  } catch (error) {
    console.error('Error clearing expired cache:', error)
    return 0
  }
}

export async function getCacheStatistics(): Promise<{
  totalEntries: number
  totalUsage: number
  averageAge: number
  oldestEntry: number
  newestEntry: number
}> {
  try {
    const kv = getKvStore()
    if (!kv) {
      return {
        totalEntries: 0,
        totalUsage: 0,
        averageAge: 0,
        oldestEntry: 0,
        newestEntry: 0
      }
    }

    const cacheData = await kv.get<CachedClassification[]>('classification-cache')
    if (!cacheData || cacheData.length === 0) {
      return {
        totalEntries: 0,
        totalUsage: 0,
        averageAge: 0,
        oldestEntry: 0,
        newestEntry: 0
      }
    }
    
    const now = Date.now()
    const totalUsage = cacheData.reduce((sum, item) => sum + item.usageCount, 0)
    const ages = cacheData.map(item => now - item.timestamp)
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length
    const oldestEntry = Math.max(...ages)
    const newestEntry = Math.min(...ages)
    
    return {
      totalEntries: cacheData.length,
      totalUsage,
      averageAge,
      oldestEntry,
      newestEntry
    }
  } catch (error) {
    console.error('Error getting cache statistics:', error)
    return {
      totalEntries: 0,
      totalUsage: 0,
      averageAge: 0,
      oldestEntry: 0,
      newestEntry: 0
    }
  }
}
