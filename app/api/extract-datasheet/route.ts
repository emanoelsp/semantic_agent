import { NextRequest, NextResponse } from "next/server"
import { validateIndustrialContext } from "@/lib/guardrail"
import {
  extractDatasheetPayloadFromPdf,
  invokeAgentForDatasheetPayload,
  type DatasheetPayload,
} from "@/lib/datasheet-agent"
import { parseToonOrchestrator } from "@/lib/toon-orchestrator-parser"
import { generateAASFromDatasheetMappings } from "@/lib/aas-datasheet"
import {
  generateNodeRedFlow,
  type ProcessingResult,
  type ReasoningStep,
  type ToonMapping,
} from "@/lib/mock-data"
import { getInterpretation } from "@/lib/interpretation"

// POST /api/extract-datasheet
// Recebe PDF → Gemini extrai payload → mapeia para multi-TOON → gera AAS
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Envie um arquivo PDF válido" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfBase64 = buffer.toString("base64")

    if (pdfBase64.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF muito grande (máx. 20 MB)" },
        { status: 413 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "API do Gemini não configurada. Configure GEMINI_API_KEY.",
          code: "GEMINI_API_KEY_MISSING",
        },
        { status: 503 }
      )
    }

    // 1. Extrair payload do PDF via Gemini (sem pdf-parse)
    let payload: DatasheetPayload
    try {
      payload = await extractDatasheetPayloadFromPdf(pdfBase64)
    } catch (extractErr) {
      const msg = extractErr instanceof Error ? extractErr.message : "Falha ao extrair payload"
      const isQuota = /quota|rate|429|503|billing|credit/i.test(msg)
      return NextResponse.json(
        {
          error: isQuota ? "API do Gemini fora ou recursos esgotados." : msg,
          code: isQuota ? "GEMINI_QUOTA" : "EXTRACT_ERROR",
        },
        { status: 502 }
      )
    }

    // Guardrail sobre o payload extraído
    const sampleText = payload.data_points
      .map((dp) => `${dp.source_tag} ${dp.description}`)
      .join(" ")
    const guardrailResult = validateIndustrialContext({ inputData: sampleText })
    if (!guardrailResult.valid) {
      return NextResponse.json(
        { error: guardrailResult.reason ?? "Conteúdo fora do escopo industrial" },
        { status: 400 }
      )
    }

    // 2. Mapear payload para multi-MAP TOON
    let toonOutput: string
    try {
      toonOutput = await invokeAgentForDatasheetPayload(payload)
    } catch (mapErr) {
      const msg = mapErr instanceof Error ? mapErr.message : "Falha no mapeamento"
      const isQuota = /quota|rate|429|503/i.test(msg)
      return NextResponse.json(
        {
          error: isQuota ? "API do Gemini fora ou recursos esgotados." : msg,
          code: isQuota ? "GEMINI_QUOTA" : "MAP_ERROR",
        },
        { status: 502 }
      )
    }

    // 3. Parse multi-MAP TOON
    const parsed = parseToonOrchestrator(toonOutput)
    if (parsed.mappings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum mapeamento TOON válido", raw: toonOutput },
        { status: 422 }
      )
    }

    // 4. Enriquecer mappings com description/dataType do payload
    const descriptionMap = new Map(payload.data_points.map((dp) => [dp.source_tag, dp.description]))
    const dataTypeMap = new Map(payload.data_points.map((dp) => [dp.source_tag, dp.data_type]))
    const datasheetMappings = parsed.mappings.map((m) => ({
      ...m,
      description: descriptionMap.get(m.source),
      dataType: dataTypeMap.get(m.source),
    }))

    // 5. Gerar AAS
    const assetIdShort = payload.asset_id.split("_").slice(-2).join("_") || payload.asset_id
    const aasJson = generateAASFromDatasheetMappings(
      payload.asset_id,
      assetIdShort,
      datasheetMappings,
      payload.data_points
    )

    // Primary mapping para compatibilidade com UI (primeiro mapeamento)
    const primary = parsed.mappings[0]
    const toonMapping: ToonMapping = {
      source: primary.source,
      target: primary.target,
      eclassId: primary.eclassId,
      action: "DirectMap",
      unit: "unknown",
    }

    // Interpretação contextual (datasheet/equipamento)
    let interpretation: string | undefined
    try {
      interpretation = await getInterpretation({
        inputData: payload.asset_id,
        inputType: "datasheet",
        mapping: {
          source: primary.source,
          target: primary.target,
          eclassId: primary.eclassId,
        },
        datasheetContext: {
          asset_id: payload.asset_id,
          data_points_count: payload.data_points.length,
        },
      })
    } catch {
      // não falha o fluxo
    }

    const reasoningSteps: ReasoningStep[] = [
      { step: 1, action: "Extração PDF", detail: "Payload extraído via Gemini (asset_id, data_points)", timestamp: "0.5s" },
      { step: 2, action: "Validação Guardrail", detail: "Contexto industrial confirmado", timestamp: "0.6s" },
      { step: 3, action: "Mapeamento TOON", detail: `${parsed.mappings.length} variáveis mapeadas para ECLASS`, timestamp: "1.5s" },
      { step: 4, action: "Geração AAS", detail: "Submodel OperationalVariables criado", timestamp: "1.6s" },
    ]

    const result: ProcessingResult & {
      source?: "llm"
      datasheetPayload?: DatasheetPayload
      datasheetMappings?: typeof datasheetMappings
      aasJson?: object
      interpretation?: string
    } = {
      status: "success",
      inputType: "brownfield",
      inputData: payload.asset_id,
      source: "llm",
      reasoningSteps,
      toonOutput,
      toonMapping,
      confidence: 0.95,
      aasPreview: {
        idShort: assetIdShort,
        semanticId: primary.eclassId,
        valueType: "object",
        value: "multi-mapping",
        qualifiers: [{ type: "Mapping_Count", value: String(parsed.mappings.length) }],
      },
      processingTimeMs: Date.now() - startTime,
      datasheetPayload: payload,
      datasheetMappings,
      aasJson,
      ...(interpretation ? { interpretation } : {}),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("[api/extract-datasheet]", err)
    return NextResponse.json(
      { error: "Erro ao processar datasheet" },
      { status: 500 }
    )
  }
}
