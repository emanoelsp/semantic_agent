// =============================================================================
// Interpretation - Contexto semântico gerado pelo LLM
// =============================================================================
// Gera descrição contextual sobre a variável/API/documento após inferência.
// Usado na Página 2 (Análise) para explicar o que o agente identificou.
// =============================================================================

import { GoogleGenAI } from "@google/genai"

export type InterpretationInputType = "brownfield" | "greenfield" | "datasheet"

export interface InterpretationRequest {
  inputData: string
  inputType: InterpretationInputType
  mapping: { source: string; target: string; eclassId: string }
  datasheetContext?: {
    asset_id: string
    data_points_count: number
  }
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY não configurada")
  return key
}

/**
 * Obtém interpretação contextual em português sobre o que o agente identificou.
 */
export async function getInterpretation(req: InterpretationRequest): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() })

  let prompt: string

  if (req.inputType === "datasheet" && req.datasheetContext) {
    prompt = `Com base no processamento do datasheet PDF:
- asset_id: ${req.datasheetContext.asset_id}
- ${req.datasheetContext.data_points_count} variáveis mapeadas

Escreva em 2-3 frases em português: sobre qual equipamento se trata, possível fabricante, e contexto geral do conjunto de variáveis (sensores, atuadores, etc.). Seja objetivo.`
  } else if (req.inputType === "greenfield") {
    prompt = `Com base no mapeamento realizado:
- Endpoint/API: ${req.inputData}
- Mapeado para: ${req.mapping.target} (ECLASS ${req.mapping.eclassId})

Escreva em 2-3 frases em português: sobre o que essa API provavelmente é e faz, tipo de dados que expõe, possível contexto de uso (sensor, CPS, gateway, etc.).`
  } else {
    // brownfield - tag/variavel única
    prompt = `Com base no mapeamento realizado:
- Tag: ${req.inputData}
- Mapeado para: ${req.mapping.target} (ECLASS ${req.mapping.eclassId})

Escreva em 2-3 frases em português: sobre o que essa variável provavelmente é, possibilidade de fabricante (Siemens, Allen-Bradley, etc.), tipo de sinal e contexto de uso.`
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    })

    const text = response.text?.trim() ?? ""
    return text || "Interpretação não disponível."
  } catch {
    return "Interpretação indisponível (falha na chamada ao modelo)."
  }
}
