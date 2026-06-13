import { RefObject, useState } from 'react'
import * as htmlToImage from 'html-to-image'

export function usePlaquinhaGenerator(
  ref: RefObject<HTMLDivElement | null>,
  petName: string
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function downloadPNG() {
    if (!ref.current) return
    setIsGenerating(true)
    setError(null)
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 3 })
      const link = document.createElement('a')
      link.download = `plaquinha-${petName.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = dataUrl
      link.click()
      link.remove()
    } catch (err) {
      setError('Erro ao gerar imagem — tente usar uma foto diferente')
    } finally {
      setIsGenerating(false)
    }
  }

  async function downloadPDF() {
    if (!ref.current) return
    setIsGenerating(true)
    setError(null)
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { pixelRatio: 3 })
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'cm', format: [5, 5] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, 5, 5)
      pdf.save(`plaquinha-${petName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (err) {
      setError('Erro ao gerar PDF — tente novamente')
    } finally {
      setIsGenerating(false)
    }
  }

  return { downloadPNG, downloadPDF, isGenerating, error }
}
