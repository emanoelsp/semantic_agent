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

// POST /api/orchestrator
// Fluxo: Input -> Guardrail -> Agent (LLM) -> Parser TOON -> JSON estruturado
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { inputData, inputType, useLLM } = body as {
      inputData: string
      inputType: "brownfield" | "greenfield"
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

    let toonOutput: string
    let usedLLM = false

    // B/C. Chamar agente LLM se useLLM=true e API key disponível
    if (useLLM !== false && process.env.GEMINI_API_KEY) {
      try {
        const agentResult = await invokeAgent({ inputData, inputType })
        toonOutput = agentResult.toonOutput
        usedLLM = true
      } catch (agentErr) {
        const message = agentErr instanceof Error ? agentErr.message : "Falha no agente"
        return NextResponse.json(
          { error: message, fallback: "Use useLLM: false para modo mock" },
          { status: 502 }
        )
      }
    } else {
      // Fallback: mock TOON no formato esperado
      const mockMapping = getMockToonForInput(inputData, inputType)
      toonOutput = mockMapping
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

    const result: ProcessingResult & { source?: "llm" | "mock" } = {
      status: enriched.confidence >= 0.85 ? "success" : "warning",
      inputType,
      inputData: String(inputData).trim(),
      source: usedLLM ? "llm" : "mock",
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

function getMockToonForInput(inputData: string, inputType: string): string {
  const tag = String(inputData).trim()
  const known: Record<string, string> = {
    "DB10.W2":
      "⟨MAP_START⟩⟨SRC:DB10.W2⟩⟨TGT:ECLASS:0173-1#02-BAA123⟩⟨CONF:0.92⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    "DB1.DBX0.1":
      "⟨MAP_START⟩⟨SRC:DB1.DBX0.1⟩⟨TGT:ECLASS:0173-1#02-BAF321#004⟩⟨CONF:0.95⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    "/temp/v1":
      "⟨MAP_START⟩⟨SRC:/temp/v1⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.88⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    "Mtr_Tmp_01":
      "⟨MAP_START⟩⟨SRC:Mtr_Tmp_01⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.90⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
  }
  return (
    known[tag] ??
    `⟨MAP_START⟩⟨SRC:${tag}⟩⟨TGT:ECLASS:0173-1#02-AAA000⟩⟨CONF:0.72⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩`
  )
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
