import type { HSCode } from '@/types'

export const HS_CODE_DATABASE: HSCode[] = [
  {
    code4Digits: '1101',
    code6Digits: '1101.00',
    code8Digits: '1101.00.10',
    descriptionBa: 'Brašno pšenično ili brašno od raži',
    descriptionEn: 'Wheat or meslin flour',
    descriptionDe: 'Mehl von Weizen oder von Mengkorn',
    descriptionHr: 'Pšenično brašno ili brašno od raženog mješanca',
    descriptionSr: 'Pšenično brašno ili brašno od raži',
    chapter: 11,
    heading: '1101',
    precedentReferences: [
      {
        source: 'TARIC',
        caseId: 'TARIC-2024-1101',
        bindingLevel: 'mandatory',
        date: '2024-01-15'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Pšenično zrno, mljeveno',
      processingMethod: 'Mljavanje, prosijavanje',
      endUse: 'Proizvodnja hljeba i peciva'
    },
    tariffInfo: {
      dutyRate: '10%',
      vatRate: '17%'
    },
    isActive: true
  },
  {
    code4Digits: '1701',
    code6Digits: '1701.99',
    code8Digits: '1701.99.10',
    descriptionBa: 'Šećer od šećerne trske ili šećerne repe i hemijski čista saharoza, u čvrstom obliku',
    descriptionEn: 'Cane or beet sugar and chemically pure sucrose, in solid form',
    descriptionDe: 'Rohr- oder Rübenzucker und chemisch reine Saccharose, fest',
    descriptionHr: 'Šećer od šećerne trske ili repe i kemijski čista saharoza, u krutom stanju',
    descriptionSr: 'Šećer od šećerne trske ili repe i hemijski čista saharoza, u čvrstom obliku',
    chapter: 17,
    heading: '1701',
    precedentReferences: [
      {
        source: 'WCO',
        caseId: 'WCO-HS-2022-1701',
        bindingLevel: 'mandatory',
        date: '2022-03-10'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Saharoza min. 99.5%',
      processingMethod: 'Rafiniranje šećerne trske ili repe',
      endUse: 'Ljudska prehrana, industrijska upotreba'
    },
    tariffInfo: {
      dutyRate: '50 EUR/100kg',
      vatRate: '17%'
    },
    isActive: true
  },
  {
    code4Digits: '8471',
    code6Digits: '8471.30',
    code8Digits: '8471.30.00',
    descriptionBa: 'Mašine za automatsku obradu podataka i njihove jedinice; magnetni ili optički čitači',
    descriptionEn: 'Automatic data processing machines and units thereof; magnetic or optical readers',
    descriptionDe: 'Maschinen zur automatischen Datenverarbeitung und ihre Einheiten',
    descriptionHr: 'Strojevi za automatsku obradu podataka i njihove jedinice',
    descriptionSr: 'Mašine za automatsku obradu podataka i njihove jedinice',
    chapter: 84,
    heading: '8471',
    precedentReferences: [
      {
        source: 'EU_CURIA',
        caseId: 'C-2023-8471',
        bindingLevel: 'mandatory',
        date: '2023-06-20'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Elektroničke komponente, plastika, metal',
      processingMethod: 'Industrijska proizvodnja računara',
      endUse: 'Obrada podataka, računarski rad'
    },
    tariffInfo: {
      dutyRate: '0%',
      vatRate: '17%'
    },
    isActive: true
  },
  {
    code4Digits: '2203',
    code6Digits: '2203.00',
    code8Digits: '2203.00.10',
    descriptionBa: 'Pivo od slada',
    descriptionEn: 'Beer made from malt',
    descriptionDe: 'Bier aus Malz',
    descriptionHr: 'Pivo od slada',
    descriptionSr: 'Pivo od slada',
    chapter: 22,
    heading: '2203',
    precedentReferences: [
      {
        source: 'TARIC',
        caseId: 'TARIC-2023-2203',
        bindingLevel: 'mandatory',
        date: '2023-08-01'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Voda, slad, hmelj, kvasac',
      processingMethod: 'Fermentacija',
      endUse: 'Ljudska potrošnja kao piće'
    },
    tariffInfo: {
      dutyRate: '0 EUR/hl',
      vatRate: '17%',
      excise: '5 EUR/hl'
    },
    isActive: true
  },
  {
    code4Digits: '6203',
    code6Digits: '6203.42',
    code8Digits: '6203.42.11',
    descriptionBa: 'Muške ili dječačke hlače, pantalone sa naramenicama, bermude i šorcevi od pamuka',
    descriptionEn: "Men's or boys' trousers, bib and brace overalls, breeches and shorts, of cotton",
    descriptionDe: 'Lange Hosen, Latzhosen, Kniebundhosen und kurze Hosen, für Männer oder Knaben, aus Baumwolle',
    descriptionHr: 'Muške ili dječje hlače, hlače s naramenicama, bermude i kratke hlače od pamuka',
    descriptionSr: 'Muške ili dečje pantalone sa naramenicama, bermude i šorcevi od pamuka',
    chapter: 62,
    heading: '6203',
    precedentReferences: [
      {
        source: 'WCO',
        caseId: 'WCO-HS-2021-6203',
        bindingLevel: 'persuasive',
        date: '2021-11-15'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Pamuk min. 85%',
      processingMethod: 'Tkanje, šivenje',
      endUse: 'Odjeća za muškarce i dječake'
    },
    tariffInfo: {
      dutyRate: '12%',
      vatRate: '17%'
    },
    isActive: true
  },
  {
    code4Digits: '0901',
    code6Digits: '0901.21',
    code8Digits: '0901.21.00',
    descriptionBa: 'Kafa pržena, s kofeinom',
    descriptionEn: 'Coffee, roasted, not decaffeinated',
    descriptionDe: 'Kaffee, geröstet, nicht entkoffeiniert',
    descriptionHr: 'Kava pržena, s kofeinom',
    descriptionSr: 'Kafa pržena, sa kofeinom',
    chapter: 9,
    heading: '0901',
    precedentReferences: [
      {
        source: 'TARIC',
        caseId: 'TARIC-2022-0901',
        bindingLevel: 'mandatory',
        date: '2022-05-10'
      }
    ],
    classificationCriteria: {
      materialComposition: 'Pržena kafa zrna, kofein prisutan',
      processingMethod: 'Prženje zelenih kafa zrna',
      endUse: 'Priprema kafe kao napitka'
    },
    tariffInfo: {
      dutyRate: '7.5%',
      vatRate: '17%'
    },
    isActive: true
  }
]

export function findHSCode(code8Digits: string): HSCode | undefined {
  return HS_CODE_DATABASE.find(hsc => hsc.code8Digits === code8Digits)
}

export function searchHSCodes(query: string, language: string = 'ba'): HSCode[] {
  const lowerQuery = query.toLowerCase()
  return HS_CODE_DATABASE.filter(hsc => {
    const descKey = `description${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof HSCode
    const description = hsc[descKey] || hsc.descriptionBa
    return (
      hsc.code8Digits.includes(query) ||
      hsc.code6Digits.includes(query) ||
      hsc.code4Digits.includes(query) ||
      (typeof description === 'string' && description.toLowerCase().includes(lowerQuery))
    )
  })
}

export function getHSCodesByChapter(chapter: number): HSCode[] {
  return HS_CODE_DATABASE.filter(hsc => hsc.chapter === chapter)
}

export function validateHSCodeExists(code8Digits: string): boolean {
  return HS_CODE_DATABASE.some(hsc => hsc.code8Digits === code8Digits)
}

export function getHSCodeHierarchy(code8Digits: string): {
  code4: string
  code6: string
  code8: string
  valid: boolean
} {
  const code4 = code8Digits.slice(0, 4)
  const code6 = code8Digits.slice(0, 7)
  const code8 = code8Digits

  const exists4 = HS_CODE_DATABASE.some(hsc => hsc.code4Digits === code4)
  const exists6 = HS_CODE_DATABASE.some(hsc => hsc.code6Digits === code6)
  const exists8 = HS_CODE_DATABASE.some(hsc => hsc.code8Digits === code8)

  return {
    code4,
    code6,
    code8,
    valid: exists4 && exists6 && exists8
  }
}
