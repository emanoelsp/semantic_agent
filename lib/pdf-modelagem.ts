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
      if (y > 275) {
        doc.addPage()
        y = margin
      }
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
      if (y > 275) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += 4
    }
    doc.setFont("helvetica", "normal")
  }

  // Cabeçalho Técnico do Produto
  addText("Especificação Técnica de Interoperabilidade Semântica (AAS v3.0 / ECLASS 14.0)", 14, true)
  addText("Semantic Agent — Pacote IDTA-01001-3-0 & Node-RED Edge", 9)
  y += 4

  // 1. Identificação do Ativo e Telemetria
  addSection(
    "1. Identificação do Ativo e Qualidade Semântica",
    [
      `Origem: ${result.inputType === "brownfield" ? "Brownfield (CLP / Fieldbus)" : "Greenfield (CPS / REST / MQTT)"}`,
      `Identificador / Tag: ${result.inputData}`,
      `Índice de Confiança Semântica: ${Math.round(result.confidence * 100)}% (${
        result.confidence >= 0.85 ? "Aprovado Automaticamente" : "Encaminhado para Revisão HITL"
      })`,
    ].join("\n")
  )

  // 2. Cadeia Simbólica TOON
  addSection("2. Representação Simbólica TOON (BNF Validated)", result.toonOutput)

  // 3. Propriedade Semântica ECLASS 14.0 / IEC 61360
  addSection(
    "3. Alinhamento ECLASS 14.0 / IEC 61360 CDD",
    [
      `IRDI Oficial: ${result.toonMapping.eclassId}`,
      `Designação Preferencial: ${result.toonMapping.target}`,
      `Operação de Transformação: ${result.toonMapping.action}`,
      `Unidade de Engenharia (UNECE): ${result.toonMapping.unit || "unitless"}`,
      result.toonMapping.actionDetail ? `Fórmula Dimensional: ${result.toonMapping.actionDetail}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  )

  // 4. Ambiente IDTA AAS v3.0
  const aasStr =
    result.aasJson != null
      ? JSON.stringify(result.aasJson, null, 2)
      : generateAASJson(result)
  addSection("4. Asset Administration Shell (IDTA-01001-3-0 v3.0 JSON)", aasStr)

  // 5. Fluxo Node-RED Industrial Edge
  addSection("5. Node-RED Industrial Edge Flow (semantic-plc-mapper)", generateNodeRedFlow(result))

  // Rodapé Comercial
  y += 5
  addText("Semantic Agent — Conformidade IEC 63278 / IDTA AAS v3.0 / ECLASS 14.0", 8)

  doc.save(`especificacao-aas-${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`)
}
