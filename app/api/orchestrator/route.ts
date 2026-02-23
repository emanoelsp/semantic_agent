import { NextRequest, NextResponse } from "next/server"
import { validateIndustrialContext } from "@/lib/guardrail"
import { invokeAgent } from "@/lib/agent"
import { parseToonOrchestrator } from "@/lib/toon-orchestrator-parser"
import { applyEclassFallback } from "@/lib/eclass-fallback"
import {
  generateAASJson,
  generateNodeRedFlow,
  type ProcessingResult,
  type ReasoningStep,
  type ToonMapping as MockToonMapping,
} from "@/lib/mock-data"
import { getEclassCandidates } from "@/lib/eclass-fallback"
import { getInterpretation } from "@/lib/interpretation"

// POST /api/orchestrator
// Fluxo: Input -> Guardrail -> Agent (LLM) -> Parser TOON -> JSON estruturado
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { inputData, inputType, description, datatype } = body as {
      inputData: string
      inputType: "brownfield" | "greenfield"
      description?: string
      datatype?: string
      useLLM?: boolean
    }

    if (!inputData || !inputType) {
      return NextResponse.json(
        { error: "Campos 'inputData' e 'inputType' são obrigatórios" },
        { status: 400 }
      )
    }

    // A. Guardrail interno
    const guardrailResult = validateIndustrialContext({ inputData })
    if (!guardrailResult.valid) {
      return NextResponse.json(
        { error: guardrailResult.reason ?? "Contexto não industrial" },
        { status: 400 }
      )
    }

    // B/C. Chamar agente LLM (obrigatório; sem mock)
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "API do Gemini não configurada. Configure GEMINI_API_KEY no .env.local ou na Vercel.",
          code: "GEMINI_API_KEY_MISSING",
        },
        { status: 503 }
      )
    }

    let toonOutput: string
    try {
      const agentResult = await invokeAgent({
        inputData,
        inputType,
        ...(description?.trim() && { description: String(description).trim() }),
        ...(datatype?.trim() && { datatype: String(datatype).trim() }),
      })
      toonOutput = agentResult.toonOutput
    } catch (agentErr) {
      const message = agentErr instanceof Error ? agentErr.message : "Falha no agente"
      const isQuotaOrRateLimit =
        /quota|rate.?limit|resource.?exhausted|429|503/i.test(message) ||
        /billing|credit|exceeded/i.test(message)
      const isNetwork = /network|fetch|connection|timeout|ECONNREFUSED/i.test(message)
      return NextResponse.json(
        {
          error: isQuotaOrRateLimit
            ? "API do Gemini fora ou recursos esgotados. Verifique quota/créditos no Google AI Studio."
            : isNetwork
              ? "Falha de conexão com a API do Gemini. Tente novamente."
              : message,
          code: isQuotaOrRateLimit ? "GEMINI_QUOTA" : isNetwork ? "GEMINI_NETWORK" : "GEMINI_ERROR",
        },
        { status: 502 }
      )
    }

    // D/E. Parse TOON e converter para JSON estruturado
    const parsed = parseToonOrchestrator(toonOutput)

    const primaryMapping = parsed.mappings[0]
    if (!primaryMapping) {
      return NextResponse.json(
        {
          error: "Nenhum mapeamento TOON válido retornado",
          raw: toonOutput,
          parsed,
        },
        { status: 422 }
      )
    }

    // Propor candidatos ECLASS quando score < 70%
    const eclassCandidates =
      primaryMapping.confidence < 0.7
        ? getEclassCandidates(primaryMapping.source)
        : undefined

    // Fallback ECLASS: força modelagem AAS com código ECLASS quando LLM retorna UNKNOWN
    const enriched = applyEclassFallback(
      primaryMapping.source,
      primaryMapping.eclassId,
      primaryMapping.target,
      primaryMapping.confidence
    )

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        action: "Validação Guardrail",
        detail: "Contexto industrial confirmado",
        timestamp: "0.1s",
      },
      {
        step: 2,
        action: "Inferência LLM",
        detail: "Mapeamento semântico realizado via Gemini",
        timestamp: "0.8s",
      },
      {
        step: 3,
        action: "Parse TOON",
        detail: `SRC='${primaryMapping.source}' → TGT='${primaryMapping.target}' (conf: ${(primaryMapping.confidence * 100).toFixed(0)}%)`,
        timestamp: "1.0s",
      },
      ...(enriched.applied
        ? [
            {
              step: 4,
              action: "Fallback ECLASS",
              detail: `Inferência heurística: ECLASS ${enriched.eclassId} (${enriched.target}) - modelagem AAS forçada`,
              timestamp: "1.1s",
            } as ReasoningStep,
          ]
        : []),
    ]

    const toonMapping: MockToonMapping = {
      source: primaryMapping.source,
      target: enriched.target,
      eclassId: enriched.eclassId,
      action: "DirectMap",
      unit: enriched.unit,
    }

    // Interpretação contextual (variável única ou API)
    let interpretation: string | undefined
    try {
      interpretation = await getInterpretation({
        inputData: String(inputData).trim(),
        inputType,
        mapping: {
          source: primaryMapping.source,
          target: enriched.target,
          eclassId: enriched.eclassId,
        },
      })
    } catch {
      // não falha o fluxo se interpretação falhar
    }

    const result: ProcessingResult & {
      source?: "llm"
      eclassCandidates?: Array<{ eclassId: string; target: string; unit: string }>
      interpretation?: string
    } = {
      status: enriched.confidence >= 0.85 ? "success" : "warning",
      inputType,
      inputData: String(inputData).trim(),
      source: "llm",
      ...(eclassCandidates && eclassCandidates.length > 0 ? { eclassCandidates } : {}),
      ...(interpretation ? { interpretation } : {}),
      reasoningSteps,
      toonOutput,
      toonMapping,
      confidence: enriched.confidence,
      aasPreview: {
        idShort: toCamelCase(primaryMapping.source),
        semanticId: enriched.eclassId,
        valueType: "xs:double",
        value: "dynamic",
        qualifiers: [{ type: "Unit", value: toonMapping.unit }],
      },
      processingTimeMs: Date.now() - startTime,
    }

    const exportFormat = (body as { exportFormat?: string }).exportFormat

    if (exportFormat === "aas") {
      return NextResponse.json({
        ...result,
        exportData: generateAASJson(result),
        exportFormat: "aas",
      })
    }

    if (exportFormat === "nodered") {
      return NextResponse.json({
        ...result,
        exportData: generateNodeRedFlow(result),
        exportFormat: "nodered",
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("[api/orchestrator]", err)
    return NextResponse.json(
      { error: "Erro interno no orquestrador" },
      { status: 500 }
    )
  }
}

function inferUnit(target: string): string {
  if (/temp|temperature|temperatura/i.test(target)) return "degC"
  if (/velocity|velocidade|speed|rpm/i.test(target)) return "m/s"
  if (/pressure|pressao/i.test(target)) return "bar"
  if (/flow|vazao/i.test(target)) return "m³/h"
  return "unknown"
}

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}
