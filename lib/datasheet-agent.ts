// =============================================================================
// Datasheet Agent - Extração e mapeamento via Gemini (PDF nativo)
// =============================================================================
// Usa Gemini para processar PDF diretamente (sem pdf-parse).
// Fluxo: PDF → payload estruturado → multi-MAP TOON → AAS
// =============================================================================

import { GoogleGenAI } from "@google/genai"

export interface DatasheetDataPoint {
  source_tag: string
  description: string
  data_type: string
}

export interface DatasheetPayload {
  asset_id: string
  target_standard: string
  data_points: DatasheetDataPoint[]
}

const EXTRACT_PAYLOAD_PROMPT = `Analise este datasheet técnico industrial (PDF) e extraia:
1. asset_id: identificador único do ativo (ex: fischertechnik_Punching_Machine_96785)
2. target_standard: "ECLASS"
3. data_points: array de objetos com:
   - source_tag: identificador da variável (ex: I1, Q3, DB10.W2)
   - description: descrição técnica em inglês
   - data_type: BOOL, INT, REAL, DWORD, etc.

Retorne APENAS o JSON, sem texto adicional. Exemplo:
{
  "asset_id": "exemplo_Asset_01",
  "target_standard": "ECLASS",
  "data_points": [
    {"source_tag": "I1", "description": "Sensor description", "data_type": "BOOL"},
    {"source_tag": "Q1", "description": "Actuator description", "data_type": "BOOL"}
  ]
}`

const TOON_MAPPING_PROMPT = `Você é um Agente Cognitivo Industrial. Recebe um payload de data_points e mapeia cada um para ECLASS.

Para CADA data_point, gere um bloco TOON:
⟨MAP_START⟩⟨SRC:[source_tag]⟩⟨TGT:ECLASS:[codigo_irdi]⟩⟨CONF:[0.9-1.0]⟩⟨MAP_END⟩

Use os códigos ECLASS conforme o significado:
- Sensores fototransistor/fotoelétrico: 0173-1#02-BAA014
- Limit switch / fim de curso: 0173-1#02-BAA283
- Motor / atuador: 0173-1#02-BAB014
- Temperatura: 0173-1#02-AAB713#005
- Velocidade: 0173-1#02-BAA123
- Status operacional: 0173-1#02-BAF321#004
- Pressão: 0173-1#02-AAA699

Ao final, adicione: ⟨ACTION:GENERATE_NODE_RED⟩

NUNCA converse. Retorne APENAS os tokens TOON concatenados.`

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY não configurada")
  return key
}

/**
 * Extrai payload estruturado do PDF usando Gemini (sem bibliotecas de parsing).
 */
export async function extractDatasheetPayloadFromPdf(
  pdfBase64: string
): Promise<DatasheetPayload> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { text: EXTRACT_PAYLOAD_PROMPT },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      },
    ],
    config: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  })

  const text = response.text?.trim() ?? ""
  if (!text) throw new Error("Resposta vazia ao extrair payload do PDF")

  // Extrair JSON (pode vir com ```json)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : text
  const parsed = JSON.parse(jsonStr) as DatasheetPayload

  if (!parsed.asset_id || !Array.isArray(parsed.data_points)) {
    throw new Error("Payload inválido: asset_id e data_points obrigatórios")
  }

  return parsed
}

/**
 * Mapeia payload para multi-MAP TOON via Gemini.
 */
export async function invokeAgentForDatasheetPayload(
  payload: DatasheetPayload
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() })

  const payloadStr = JSON.stringify(payload, null, 2)

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${TOON_MAPPING_PROMPT}\n\nPayload:\n${payloadStr}`,
    config: {
      systemInstruction: "Você retorna APENAS tokens TOON. NUNCA justifique ou adicione texto.",
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  })

  const text = response.text?.trim() ?? ""
  if (!text) throw new Error("Resposta vazia ao mapear payload para TOON")
  return text
}
