// src/lib/gir-engine.ts
// Formalni GIR engine sa determinističkim pravilima i precedence logikom

export type GIRRule = 1 | 2 | 3 | 4 | 5 | 6

export interface GIRApplicability {
  rule: GIRRule
  applicable: boolean
  reason: string
  score: number // 0-100
}

export interface GIRDecision {
  hs_candidate: string
  gir_path: GIRRule[]
  applicabilities: GIRApplicability[]
  confidence: number
  citations: string[]
  final: boolean
}

/**
 * GIR Rule 1: Materials & Composition
 * - Klasifikacija prema matrijalu od kojeg je proizvod napravljen
 * - Ako je proizvod od više materijala, gleda se najznačajniji
 */
export function girRule1MaterialComposition(
  productDescription: string
): GIRApplicability {
  const materials = extractMaterials(productDescription)
  const isApplicable = materials.length > 0
  
  return {
    rule: 1,
    applicable: isApplicable,
    reason: `Product composition: ${materials.join(', ')}`,
    score: isApplicable ? 85 : 0
  }
}

/**
 * GIR Rule 2: Essential Character
 * - Kada više materijala ili karakteristika imaju istu važnost
 * - Gleda se osnovna funkcija i namera proizvoda
 */
export function girRule2EssentialCharacter(
  productDescription: string
): GIRApplicability {
  const hasFunction = /funkcij|namena|svrha|koristen|upotreb/i.test(productDescription)
  
  return {
    rule: 2,
    applicable: hasFunction,
    reason: `Essential character identified in description`,
    score: hasFunction ? 80 : 0
  }
}

/**
 * GIR Rule 3: Unfinished/Incomplete
 * - Klasifikacija necelog, nepreradenog ili nedovršenog proizvoda
 */
export function girRule3Incomplete(
  productDescription: string
): GIRApplicability {
  const incompleteMarkers = /poluproizvod|sirovij|neceo|nepreradjen|komad/i.test(productDescription)
  
  return {
    rule: 3,
    applicable: incompleteMarkers,
    reason: `Product appears to be incomplete or semi-finished`,
    score: incompleteMarkers ? 70 : 0
  }
}

/**
 * GIR Rule 4: Mixtures & Combinations
 * - Klasifikacija mešavina ili kombinacija više od 2 materijala
 */
export function girRule4Mixtures(
  productDescription: string
): GIRApplicability {
  const materials = extractMaterials(productDescription)
  const isMixture = materials.length > 1
  const dominantMaterial = materials[0] || ''
  
  return {
    rule: 4,
    applicable: isMixture,
    reason: `Mixture detected: ${materials.join(' + ')}. Dominant: ${dominantMaterial}`,
    score: isMixture ? 75 : 0
  }
}

/**
 * GIR Rule 5: Form & Packaging
 * - Ako je proizvod u specifičnoj formi koja karakteriše njegovu upotrebu
 * - Npr. u tabletu, kapsuli, sprej obliku
 */
export function girRule5FormPackaging(
  productDescription: string
): GIRApplicability {
  const formMarkers = /tabl|kapsula|prah|gel|sprej|tekuć|sirup|mast|krema/i.test(productDescription)
  
  return {
    rule: 5,
    applicable: formMarkers,
    reason: `Specific form/packaging identified`,
    score: formMarkers ? 78 : 0
  }
}

/**
 * GIR Rule 6: "Default" Rule
 * - Koristi se kada nijedna druga pravila nije jednoznačno primenljiva
 * - Gleda se pozicija koja je najsličnija po karakteristikama
 */
export function girRule6Default(
  productDescription: string,
  targetHS: string,
  precedingRulesScore: number
): GIRApplicability {
  const appliedDefault = precedingRulesScore < 60
  
  return {
    rule: 6,
    applicable: appliedDefault,
    reason: `Default rule applied - preceding rules insufficient`,
    score: appliedDefault ? 50 : 0
  }
}

// Helper: Extract materials from description
function extractMaterials(description: string): string[] {
  const materialMap: Record<string, string[]> = {
    pamuk: ['cotton', 'pamuk', 'bavovna'],
    poliester: ['polyester', 'poliester'],
    vuna: ['wool', 'vuna', 'volna'],
    liocel: ['lyocell', 'liocel'],
    pamuk_poliester: ['cotton-polyester blend', 'mixed cotton'],
    drvo: ['wood', 'drvo'],
    plastika: ['plastic', 'plastika', 'polimer'],
    metal: ['metal', 'metall', 'aluminum', 'aluminijum'],
    keramika: ['ceramic', 'keramika'],
    staklo: ['glass', 'staklo'],
    papir: ['paper', 'papir']
  }

  const found: Set<string> = new Set()
  
  for (const [material, keywords] of Object.entries(materialMap)) {
    for (const keyword of keywords) {
      if (new RegExp(keyword, 'i').test(description)) {
        found.add(material)
      }
    }
  }

  return Array.from(found).sort()
}

/**
 * Primeni sve GIR pravila sa precedence logikom
 * Precedence: GIR 1 → 2 → 3 → 4 → 5 → 6
 */
export function evaluateGIRPrecedence(
  productDescription: string,
  targetHS: string
): GIRDecision {
  // Primeni sva pravila
  const girRule1 = girRule1MaterialComposition(productDescription)
  const girRule2 = girRule2EssentialCharacter(productDescription)
  const girRule3 = girRule3Incomplete(productDescription)
  const girRule4 = girRule4Mixtures(productDescription)
  const girRule5 = girRule5FormPackaging(productDescription)
  
  // Determiniraj precedence
  let gir_path: GIRRule[] = []
  let highestScore = 0
  
  const rulesWithScores: Array<{ rule: GIRRule; applicability: GIRApplicability }> = [
    { rule: 1, applicability: girRule1 },
    { rule: 2, applicability: girRule2 },
    { rule: 3, applicability: girRule3 },
    { rule: 4, applicability: girRule4 },
    { rule: 5, applicability: girRule5 }
  ]

  for (const { rule, applicability } of rulesWithScores) {
    if (applicability.applicable && applicability.score > highestScore) {
      highestScore = applicability.score
      gir_path = [rule]
    } else if (applicability.applicable && applicability.score === highestScore) {
      gir_path.push(rule)
    }
  }

  // Ako nema primenjenog pravila, primeni Rule 6
  let girRule6Applicability: GIRApplicability | null = null
  if (gir_path.length === 0) {
    girRule6Applicability = girRule6Default(productDescription, targetHS, 0)
    gir_path = [6]
  }

  const applicabilities = [girRule1, girRule2, girRule3, girRule4, girRule5, ...(girRule6Applicability ? [girRule6Applicability] : [])]

  return {
    hs_candidate: targetHS,
    gir_path,
    applicabilities,
    confidence: highestScore / 100,
    citations: [], // Popuniti sa citation IDs
    final: highestScore >= 75
  }
}

/**
 * Komparativna analiza dva HS kodova sa GIR pravilima
 */
export function compareHSCandidates(
  productDescription: string,
  candidates: string[]
): { winner: string; decision: GIRDecision } {
  const decisions = candidates.map(hs => evaluateGIRPrecedence(productDescription, hs))
  
  // Sortiraj po confidence + GIR path priority
  decisions.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence
    }
    // Ako je isti confidence, GIR 1 > GIR 2 > ... > GIR 6
    const aMinRule = Math.min(...a.gir_path)
    const bMinRule = Math.min(...b.gir_path)
    return aMinRule - bMinRule
  })

  return {
    winner: decisions[0].hs_candidate,
    decision: decisions[0]
  }
}
