import * as XLSX from '@/lib/xlsx-shim'
import type { ClassificationHistory, Language, ScriptVariant } from '@/types'
import { t, applyScriptVariant } from '@/lib/translations'

export interface ExportOptions {
  lang: Language
  scriptVariant: ScriptVariant
  includeAllFields?: boolean
  filterFavorites?: boolean
  filterConfidence?: 'high' | 'medium' | 'low' | 'all'
  filterDateRange?: {
    from?: Date
    to?: Date
  }
}

export function exportHistoryToExcel(
  history: ClassificationHistory[],
  options: ExportOptions
): void {
  const { lang, scriptVariant, includeAllFields = true, filterFavorites, filterConfidence, filterDateRange } = options

  let filteredHistory = [...history]

  if (filterFavorites) {
    filteredHistory = filteredHistory.filter(h => h.isFavorite)
  }

  if (filterConfidence && filterConfidence !== 'all') {
    filteredHistory = filteredHistory.filter(h => h.result.confidence === filterConfidence)
  }

  if (filterDateRange) {
    const { from, to } = filterDateRange
    filteredHistory = filteredHistory.filter(h => {
      const itemDate = new Date(h.timestamp)
      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  }

  if (filteredHistory.length === 0) {
    throw new Error('No data to export after applying filters')
  }

  const worksheetData = filteredHistory.map(item => {
    const date = new Date(item.timestamp)

    const baseData: Record<string, unknown> = {
      [applyScriptVariant(t('timestamp', lang), lang, scriptVariant)]: date.toLocaleString(lang === 'en' ? 'en-US' : 'bs-BA'),
      [applyScriptVariant(t('productDescription', lang), lang, scriptVariant)]: applyScriptVariant(item.productDescription, lang, scriptVariant),
      [applyScriptVariant(t('hsCode', lang), lang, scriptVariant)]: item.result.hsCode,
    }

    if (includeAllFields) {
      const confidenceLabel = lang === 'en' ? 'Confidence' : lang === 'ba' ? 'Pouzdanost' : lang === 'sr' ? 'Поузданост' : 'Confidence'
      baseData[applyScriptVariant(confidenceLabel, lang, scriptVariant)] = 
        applyScriptVariant(getConfidenceText(item.result.confidence, lang), lang, scriptVariant)
      
      baseData[applyScriptVariant(t('defensibilityScore', lang), lang, scriptVariant)] = item.result.defensibilityScore

      if (item.result.reasoning && item.result.reasoning.length > 0) {
        baseData[applyScriptVariant(t('reasoning', lang), lang, scriptVariant)] = applyScriptVariant(item.result.reasoning.join(' | '), lang, scriptVariant)
      }

      if (item.result.verificationHash) {
        baseData[applyScriptVariant(t('verificationHash', lang), lang, scriptVariant)] = item.result.verificationHash
      }

      if (item.result.legalBasis) {
        const legalBasisParts: string[] = []
        if (item.result.legalBasis.wco) legalBasisParts.push(`WCO: ${item.result.legalBasis.wco}`)
        if (item.result.legalBasis.taric) legalBasisParts.push(`TARIC: ${item.result.legalBasis.taric}`)
        if (item.result.legalBasis.euCuria) legalBasisParts.push(`EU Curia: ${item.result.legalBasis.euCuria}`)
        if (item.result.legalBasis.uioBih) legalBasisParts.push(`UIO BiH: ${item.result.legalBasis.uioBih}`)
        
        if (legalBasisParts.length > 0) {
          baseData[applyScriptVariant(t('legalBasis', lang), lang, scriptVariant)] = applyScriptVariant(legalBasisParts.join(' | '), lang, scriptVariant)
        }
      }

      baseData[applyScriptVariant(t('favorite', lang), lang, scriptVariant)] = item.isFavorite ? '⭐' : ''
    }

    return baseData
  })

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)

  const columnWidths = Object.keys(worksheetData[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...worksheetData.map(row => (row[key] ? String(row[key]).length : 0))
    )
    return { wch: Math.min(Math.max(maxLength + 2, 15), 60) }
  })
  worksheet['!cols'] = columnWidths

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
      const cell = worksheet[cellAddress]
      if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
        if (R === 0) {
          (cell as XLSX.CellObject).s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: 'E8E8E8' } },
            alignment: { vertical: 'center', horizontal: 'center' }
          }
        } else {
          (cell as XLSX.CellObject).s = {
            alignment: { vertical: 'top', wrapText: true }
          }
        }
      }
    }
  }

  const autoFilterRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(autoFilterRange) }

  const workbook = XLSX.utils.book_new()
  const sheetName = applyScriptVariant(t('history', lang), lang, scriptVariant).substring(0, 31)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  workbook.Workbook = {
    Views: [{ RTL: false }]
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
  const fileName = `Carinski-Alat-Export-${timestamp[0]}-${timestamp[1].substring(0, 8)}.xlsx`
  
  XLSX.writeFile(workbook, fileName)
}

function getConfidenceText(confidence: string, lang: Language): string {
  switch (confidence) {
    case 'high':
      return t('highConfidence', lang)
    case 'medium':
      return t('mediumConfidence', lang)
    case 'low':
      return t('lowConfidence', lang)
    default:
      return confidence
  }
}

export function exportHistoryToCSV(
  history: ClassificationHistory[],
  options: ExportOptions
): void {
  const { lang, scriptVariant, includeAllFields = true, filterFavorites, filterConfidence, filterDateRange } = options

  let filteredHistory = [...history]

  if (filterFavorites) {
    filteredHistory = filteredHistory.filter(h => h.isFavorite)
  }

  if (filterConfidence && filterConfidence !== 'all') {
    filteredHistory = filteredHistory.filter(h => h.result.confidence === filterConfidence)
  }

  if (filterDateRange) {
    const { from, to } = filterDateRange
    filteredHistory = filteredHistory.filter(h => {
      const itemDate = new Date(h.timestamp)
      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  }

  if (filteredHistory.length === 0) {
    throw new Error('No data to export after applying filters')
  }

  const headers = [
    applyScriptVariant(t('timestamp', lang), lang, scriptVariant),
    applyScriptVariant(t('productDescription', lang), lang, scriptVariant),
    applyScriptVariant(t('hsCode', lang), lang, scriptVariant),
  ]

  if (includeAllFields) {
    headers.push(
      applyScriptVariant('Pouzdanost', lang, scriptVariant),
      applyScriptVariant(t('defensibilityScore', lang), lang, scriptVariant),
      applyScriptVariant(t('reasoning', lang), lang, scriptVariant)
    )
  }

  const rows = filteredHistory.map(item => {
    const date = new Date(item.timestamp)
    const baseRow = [
      date.toLocaleString(lang === 'en' ? 'en-US' : 'bs-BA'),
      applyScriptVariant(item.productDescription, lang, scriptVariant),
      item.result.hsCode,
    ]

    if (includeAllFields) {
      baseRow.push(
        applyScriptVariant(getConfidenceText(item.result.confidence, lang), lang, scriptVariant),
        item.result.defensibilityScore.toString(),
        applyScriptVariant(item.result.reasoning.join(' | '), lang, scriptVariant)
      )
    }

    return baseRow
  })

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
  const fileName = `Carinski-Alat-Export-${timestamp[0]}-${timestamp[1].substring(0, 8)}.csv`

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export function exportHistoryToJSON(
  history: ClassificationHistory[],
  options: ExportOptions
): void {
  const { lang, scriptVariant, includeAllFields = true, filterFavorites, filterConfidence, filterDateRange } = options

  let filteredHistory = [...history]

  if (filterFavorites) {
    filteredHistory = filteredHistory.filter(h => h.isFavorite)
  }

  if (filterConfidence && filterConfidence !== 'all') {
    filteredHistory = filteredHistory.filter(h => h.result.confidence === filterConfidence)
  }

  if (filterDateRange) {
    const { from, to } = filterDateRange
    filteredHistory = filteredHistory.filter(h => {
      const itemDate = new Date(h.timestamp)
      if (from && itemDate < from) return false
      if (to && itemDate > to) return false
      return true
    })
  }

  if (filteredHistory.length === 0) {
    throw new Error('No data to export after applying filters')
  }

  const exportData = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      totalRecords: filteredHistory.length,
      language: lang,
      scriptVariant,
      filters: {
        favorites: filterFavorites || false,
        confidence: filterConfidence || 'all',
        dateRange: filterDateRange || null
      }
    },
    classifications: filteredHistory.map(item => {
      const hsData = findHSCode(item.result.hsCode)
      
      const baseData: Record<string, unknown> = {
        id: item.id,
        timestamp: new Date(item.timestamp).toISOString(),
        productDescription: applyScriptVariant(item.productDescription, lang, scriptVariant),
        hsCode: item.result.hsCode,
        confidence: item.result.confidence,
        defensibilityScore: item.result.defensibilityScore,
        isFavorite: item.isFavorite || false
      }

      if (includeAllFields) {
        baseData.reasoning = item.result.reasoning
        baseData.verificationHash = item.result.verificationHash
        baseData.legalBasis = item.result.legalBasis
        
        if (hsData) {
          baseData.hsCodeDetails = {
            description: applyScriptVariant(hsData.descriptionBa, lang, scriptVariant),
            chapter: hsData.chapter,
            heading: hsData.heading,
            tariffInfo: hsData.tariffInfo
          }
        }
      }

      return baseData
    })
  }

  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')
  const fileName = `Carinski-Alat-Export-${timestamp[0]}-${timestamp[1].substring(0, 8)}.json`

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
