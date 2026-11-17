// =============================================================================
// Datasheet Agent - Extração e mapeamento semântico via Gemini (PDF nativo)
// =============================================================================
// Extrai Nameplate metadata + data_points de datasheets industriais em PDF,
// aplica RAG com o dicionário ECLASS 14.0 e gera multi-MAP TOON para AAS v3.0.
// =============================================================================

import { GoogleGenAI } from "@google/genai"
import { ECLASS_DICTIONARY } from "@/lib/aas-v3"
import { datasheetMetadataSchema } from "@/lib/validation"

export interface DatasheetDataPoint {
  source_tag: string
  description: string
  data_type: string
  unit?: string
}

export interface DatasheetPayload {
  asset_id: string
  manufacturer_name?: string
  product_designation?: string
  serial_number?: string
  year_of_construction?: string
  target_standard: string
  data_points: DatasheetDataPoint[]
}

const EXTRACT_PAYLOAD_PROMPT = `Você é um Engenheiro de Automação Industrial especialista em normas IDTA AAS v3.0 e ECLASS 14.0.
Analise este datasheet técnico ou manual de equipamento industrial (PDF) e extraia:
1. asset_id: identificador único do equipamento (ex: Siemens_SIMATIC_S7_1500_PressLine01 ou fischertechnik_Punching_Machine_96785)
2. manufacturer_name: fabricante do ativo identificado no documento (ex: Siemens AG, Festo, Bosch Rexroth, fischertechnik, WEG)
3. product_designation: modelo comercial / designação técnica do produto
4. serial_number: número de série ou código de ordem (se presente, ou gere um identificador padronizado)
5. year_of_construction: ano de fabricação ou revisão do documento (ex: "2026")
6. target_standard: "ECLASS_14.0"
7. data_points: array de todas as variáveis de I/O, tags de CLP, sensores, atuadores e parâmetros técnicos contendo:
   - source_tag: endereço de I/O ou tag (ex: I1, Q1, DB10.W2, %IW64, Motor_Speed)
   - description: descrição técnica detalhada em inglês ou português
   - data_type: BOOL, INT, REAL, DINT, WORD, STRING
   - unit: unidade de engenharia se aplicável (degC, bar, m/s, 1/min, V, A, kW, m³/h, boolean)

Retorne APENAS um objeto JSON válido, sem markdown adicional:
{
  "asset_id": "Manufacturer_Model_01",
  "manufacturer_name": "Manufacturer Name",
  "product_designation": "Product Model Designation",
  "serial_number": "SN-2026-001",
  "year_of_construction": "2026",
  "target_standard": "ECLASS_14.0",
  "data_points": [
    {"source_tag": "I1", "description": "Phototransistor light barrier sensor", "data_type": "BOOL", "unit": "boolean"}
  ]
}`

const DATASHEET_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    asset_id: { type: "string" },
    manufacturer_name: { type: "string" },
    product_designation: { type: "string" },
    serial_number: { type: "string" },
    year_of_construction: { type: "string" },
    target_standard: { type: "string", enum: ["ECLASS_14.0"] },
    data_points: {
      type: "array",
      minItems: 1,
      maxItems: 2000,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source_tag: { type: "string" },
          description: { type: "string" },
          data_type: { type: "string", enum: ["BOOL", "INT", "REAL", "DINT", "WORD", "STRING"] },
          unit: { type: "string" },
        },
        required: ["source_tag", "description", "data_type"],
      },
    },
  },
  required: ["asset_id", "target_standard", "data_points"],
} as const

function buildToonMappingPrompt(): string {
  const catalogLines = ECLASS_DICTIONARY.map(
    (entry) =>
      `- ${entry.preferredNameEn} (${entry.preferredNamePt}) [Unit: ${entry.unit}, Type: ${entry.iecDataType}]: ECLASS:${entry.irdi}`
  ).join("\n")

  return `Você é um Motor de Alinhamento Semântico Industrial (ECLASS 14.0 / IDTA AAS v3.0).
Recebe um payload estruturado de data_points extraídos de um equipamento e mapeia CADA data_point para seu IRDI ECLASS 14.0 exato.

CATÁLOGO ECLASS 14.0 OFICIAL (RAG CONTEXT):
${catalogLines}

Para CADA item em data_points, emita um bloco TOON estrito:
⟨MAP_START⟩⟨SRC:[source_tag]⟩⟨TGT:ECLASS:[codigo_irdi_completo]⟩⟨CONF:[0.70-0.99]⟩⟨MAP_END⟩

Regras de Confiança (CONF):
- Se a descrição técnica deixa claro o papel físico do sensor/atuador/grandeza: CONF entre 0.90 e 0.98.
- Se a variável for ambígua ou exigir verificação de engenharia: CONF entre 0.72 e 0.84 (acionará fila HITL).

Ao final da sequência, adicione: ⟨ACTION:GENERATE_NODE_RED⟩
NUNCA converse. Retorne APENAS os tokens TOON concatenados.`
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY não configurada")
  return key
}

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
      responseMimeType: "application/json",
      responseSchema: DATASHEET_RESPONSE_SCHEMA,
    },
  })

  const text = response.text?.trim() ?? ""
  if (!text) throw new Error("Resposta vazia ao extrair payload do PDF")

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : text
  return datasheetMetadataSchema.parse(JSON.parse(jsonStr))
}

export async function invokeAgentForDatasheetPayload(
  payload: DatasheetPayload
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() })
  const payloadStr = JSON.stringify(payload, null, 2)

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${buildToonMappingPrompt()}\n\nPayload:\n${payloadStr}`,
    config: {
      systemInstruction:
        "Você retorna APENAS tokens TOON compatíveis com a gramática BNF. NUNCA adicione explicações.",
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  })

  const text = response.text?.trim() ?? ""
  if (!text) throw new Error("Resposta vazia ao mapear payload para TOON")
  return text
}
