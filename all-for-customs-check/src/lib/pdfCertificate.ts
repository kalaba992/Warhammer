import type { ClassificationResult, Language, ScriptVariant } from '@/types'
import { applyScriptVariant } from './translations'

export interface PDFCertificateData {
  classificationResult: ClassificationResult
  productDescription: string
  certificateNumber: string
  issueDate: Date
  validUntil: Date
  lang: Language
  scriptVariant: ScriptVariant
}

export async function generatePDFCertificate(data: PDFCertificateData): Promise<Blob> {
  const {
    classificationResult,
    productDescription,
    certificateNumber,
    issueDate,
    validUntil,
    lang,
    scriptVariant
  } = data

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  canvas.width = 2480
  canvas.height = 3508
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const margin = 120
  let y = margin

  ctx.strokeStyle = '#0a1f44'
  ctx.lineWidth = 8
  ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160)

  ctx.fillStyle = '#0a1f44'
  ctx.fillRect(margin, y, canvas.width - 2 * margin, 200)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 72px Arial'
  ctx.textAlign = 'center'
  const headerText = applyScriptVariant('CARINSKI SERTIFIKAT', lang, scriptVariant)
  ctx.fillText(headerText, canvas.width / 2, y + 90)
  
  ctx.font = '42px Arial'
  const subheaderText = applyScriptVariant('HS Code Classification Certificate', lang, scriptVariant)
  ctx.fillText(subheaderText, canvas.width / 2, y + 150)

  y += 280

  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(margin, y, canvas.width - 2 * margin, 100)
  
  ctx.fillStyle = '#0a1f44'
  ctx.font = 'bold 36px Arial'
  ctx.textAlign = 'left'
  const certNumLabel = applyScriptVariant('Broj Sertifikata:', lang, scriptVariant)
  ctx.fillText(certNumLabel, margin + 40, y + 60)
  
  ctx.font = '36px monospace'
  ctx.textAlign = 'right'
  ctx.fillText(certificateNumber, canvas.width - margin - 40, y + 60)

  y += 160

  ctx.fillStyle = '#212529'
  ctx.font = 'bold 42px Arial'
  ctx.textAlign = 'left'
  const productLabel = applyScriptVariant('Opis Proizvoda:', lang, scriptVariant)
  ctx.fillText(productLabel, margin + 40, y)
  
  y += 60
  ctx.font = '36px Arial'
  ctx.fillStyle = '#495057'
  const words = productDescription.split(' ')
  let line = ''
  const maxWidth = canvas.width - 2 * margin - 80
  
  for (const word of words) {
    const testLine = line + word + ' '
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, margin + 40, y)
      line = word + ' '
      y += 50
    } else {
      line = testLine
    }
  }
  if (line !== '') {
    ctx.fillText(line, margin + 40, y)
    y += 50
  }

  y += 60

  ctx.fillStyle = '#28a745'
  ctx.fillRect(margin, y, canvas.width - 2 * margin, 180)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  const hsCodeLabel = applyScriptVariant('HS KOD:', lang, scriptVariant)
  ctx.fillText(hsCodeLabel, canvas.width / 2, y + 60)
  
  ctx.font = 'bold 72px monospace'
  ctx.fillText(classificationResult.hsCode, canvas.width / 2, y + 140)

  y += 240

  ctx.fillStyle = '#f8f9fa'
  ctx.fillRect(margin, y, canvas.width - 2 * margin, 300)
  
  ctx.fillStyle = '#0a1f44'
  ctx.font = 'bold 38px Arial'
  ctx.textAlign = 'left'
  const detailsLabel = applyScriptVariant('Detalji Klasifikacije:', lang, scriptVariant)
  ctx.fillText(detailsLabel, margin + 40, y + 50)
  
  ctx.font = '32px Arial'
  ctx.fillStyle = '#495057'
  
  const confidenceText = `${applyScriptVariant('Pouzdanost:', lang, scriptVariant)} ${classificationResult.confidence.toUpperCase()}`
  ctx.fillText(confidenceText, margin + 40, y + 110)
  
  const scoreText = `${applyScriptVariant('Defensive Score:', lang, scriptVariant)} ${classificationResult.defensibilityScore}/10`
  ctx.fillText(scoreText, margin + 40, y + 160)
  
  const hashText = `${applyScriptVariant('Verification Hash:', lang, scriptVariant)} ${classificationResult.verificationHash?.slice(0, 16)}...`
  ctx.fillText(hashText, margin + 40, y + 210)
  
  const dateText = `${applyScriptVariant('Datum:', lang, scriptVariant)} ${issueDate.toLocaleDateString()}`
  ctx.fillText(dateText, margin + 40, y + 260)

  y += 360

  ctx.fillStyle = '#212529'
  ctx.font = 'bold 36px Arial'
  const reasoningLabel = applyScriptVariant('Obrazloženje:', lang, scriptVariant)
  ctx.fillText(reasoningLabel, margin + 40, y)
  
  y += 50
  ctx.font = '28px Arial'
  ctx.fillStyle = '#495057'
  
  classificationResult.reasoning.slice(0, 3).forEach((reason, index) => {
    const bullet = `${index + 1}. ${reason}`
    const words = bullet.split(' ')
    let line = ''
    const maxWidth = canvas.width - 2 * margin - 80
    
    for (const word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, margin + 40, y)
        line = word + ' '
        y += 42
      } else {
        line = testLine
      }
    }
    if (line !== '') {
      ctx.fillText(line, margin + 40, y)
      y += 50
    }
  })

  y = canvas.height - 400

  ctx.fillStyle = '#fff3cd'
  ctx.fillRect(margin, y, canvas.width - 2 * margin, 200)
  
  ctx.fillStyle = '#856404'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  const disclaimerTitle = applyScriptVariant('PRAVNO OBAVJEŠTENJE', lang, scriptVariant)
  ctx.fillText(disclaimerTitle, canvas.width / 2, y + 50)
  
  ctx.font = '24px Arial'
  const disclaimer1 = applyScriptVariant('Ovaj sertifikat je generisan AI sistemom i služi kao', lang, scriptVariant)
  ctx.fillText(disclaimer1, canvas.width / 2, y + 90)
  
  const disclaimer2 = applyScriptVariant('pomoćno sredstvo. Finalna odluka ostaje kod carinskog organa.', lang, scriptVariant)
  ctx.fillText(disclaimer2, canvas.width / 2, y + 125)
  
  const disclaimer3 = applyScriptVariant(`Važnost sertifikata: ${validUntil.toLocaleDateString()}`, lang, scriptVariant)
  ctx.fillText(disclaimer3, canvas.width / 2, y + 165)

  y = canvas.height - 120
  ctx.fillStyle = '#6c757d'
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  const footer = applyScriptVariant('Carinski Alat - AI Customs Classification System', lang, scriptVariant)
  ctx.fillText(footer, canvas.width / 2, y)
  
  const website = 'https://all-for-customs.pages.dev'
  ctx.fillText(website, canvas.width / 2, y + 40)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to generate PDF'))
      }
    }, 'image/png')
  })
}

export function downloadPDFCertificate(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CC-${timestamp}-${random}`
}
