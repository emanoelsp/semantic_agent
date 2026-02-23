import { jsPDF } from "jspdf"
import type { ProcessingResult } from "./mock-data"
import { generateAASJson, generateNodeRedFlow } from "./mock-data"

type ResultWithDatasheet = ProcessingResult & { aasJson?: object }

export function generateModelagemFuncionalPDF(result: ResultWithDatasheet): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const lineHeight = 6
  let y = margin

  const addText = (text: string, size: number = 10, bold = false) => {
    doc.setFontSize(size)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
    lines.forEach((line: string) => {
      doc.text(line, margin, y)
      y += lineHeight * (size / 10)
    })
  }

  const addSection = (title: string, content: string) => {
    y += 3
    if (y > 270) {
      doc.addPage()
      y = margin
    }
    addText(title, 12, true)
    y += 2
    doc.setFont("courier", "normal")
    doc.setFontSize(8)
    const lines = doc.splitTextToSize(content, pageWidth - margin * 2)
    for (const line of lines) {
      if (y > 270) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 4
    }
    doc.setFont("helvetica", "normal")
  }

  // Título
  addText("Modelagem Funcional do Ativo", 16, true)
  addText("Baseado em AAS, ECLASS e Formato TOON", 10)
  y += 5

  // 1. Dados de Entrada
  addSection(
    "1. Dados de Entrada",
    [
      `Tipo: ${result.inputType === "brownfield" ? "Brownfield (PLC/Legado)" : "Greenfield (CPS/API)"}`,
      `Identificador: ${result.inputData}`,
      `Confiança: ${Math.round(result.confidence * 100)}%`,
    ].join("\n")
  )

  // 2. Mapeamento TOON
  addSection("2. Mapeamento TOON", result.toonOutput)

  // 3. ECLASS
  addSection(
    "3. Mapeamento ECLASS",
    [
      `IRDI: ${result.toonMapping.eclassId}`,
      `Significado: ${result.toonMapping.target}`,
      `Ação: ${result.toonMapping.action}`,
      `Unidade: ${result.toonMapping.unit || "N/A"}`,
      result.toonMapping.actionDetail ? `Detalhe: ${result.toonMapping.actionDetail}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  )

  // 4. AAS (Asset Administration Shell)
  const aasStr =
    result.aasJson != null
      ? JSON.stringify(result.aasJson, null, 2)
      : generateAASJson(result)
  addSection("4. AAS - Asset Administration Shell", aasStr)

  // 5. Node-RED (Modelagem de Integração)
  addSection("5. Node-RED - Fluxo de Integração", generateNodeRedFlow(result))

  // Rodapé
  y += 5
  addText("TOON Semantic Agent - Avaliação Intermediária IA Generativa", 8)
  addText("Gerado automaticamente. Gramática BNF v1.0 | ECLASS Simulado", 8)

  doc.save(`modelagem-funcional-${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
}
