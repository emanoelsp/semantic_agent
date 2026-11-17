import { NextRequest, NextResponse } from "next/server"
import {
  validateIndustrialContext,
  validatePhysicalDimensionalSafety,
  checkRateLimit,
} from "@/lib/guardrail"
import { invokeAgent, type AgentOutput } from "@/lib/agent"
import { parseToonOrchestrator } from "@/lib/toon-orchestrator-parser"
import { applyEclassFallback, getEclassCandidates } from "@/lib/eclass-fallback"
import {
  generateAASJson,
  generateNodeRedFlow,
  getMockResult,
  type ProcessingResult,
  type ReasoningStep,
  type ToonMapping as MockToonMapping,
} from "@/lib/mock-data"
import { getInterpretation } from "@/lib/interpretation"
import { buildIdtaAASEnvironment } from "@/lib/aas-v3"
import {
  authenticateRequest,
  consumeQuotaTransactional,
  enqueueHitlReview,
  refundQuotaTransactional,
} from "@/lib/firebase/admin"
import { semanticMappingRequestSchema } from "@/lib/validation"
import { assessEvidence } from "@/lib/rag/evidence-gate"
import { estimateProviderCost, type AgentUsage } from "@/lib/usage"
import { recordUsageEvent } from "@/lib/firebase/admin"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  let chargedUid: string | undefined
  let retrieval: AgentOutput["retrieval"] | undefined
  let retrievedContext: AgentOutput["retrievedContext"] = []
  let usage: AgentUsage | undefined

  try {
    // 1. Sliding-window API Rate Limit
    const ip = request.headers.get("x-forwarded-for") || "local-client"
    const rate = checkRateLimit(ip, 30, 60_000)
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit excedido. Aguarde ${rate.resetInSeconds}s.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      )
    }

    const rawBody = await request.json().catch(() => null)
    const parsedBody = semanticMappingRequestSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsedBody.error.flatten() },
        { status: 400 }
      )
    }
    const { inputData, inputType, description, datatype, exportFormat } = parsedBody.data

    // Validate before charging: malformed or out-of-domain requests are free.
    const guardrailResult = validateIndustrialContext({ inputData, description })
    if (!guardrailResult.valid) {
      return NextResponse.json(
        { error: guardrailResult.reason ?? "Contexto fora do escopo industrial" },
        { status: 400 }
      )
    }

    // 2. Authenticate Account & Enforce Paid Access (Mercado Pago Pay-as-you-go)
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        {
          error:
            "Autenticação obrigatória. Crie sua conta e faça login (ou envie sua chave x-api-key) para utilizar o Agente Semântico.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      )
    }

    const quotaCheck = await consumeQuotaTransactional({
      uid: auth.user.uid,
      creditsToConsume: 1,
    })

    if (!quotaCheck.allowed || !quotaCheck.profile) {
      return NextResponse.json(
        {
          error:
            quotaCheck.reason ||
            "Pagamento necessário: Ative sua licença Pay-as-you-go via Mercado Pago (PIX ou Cartão) para usar a API do Agente Semântico.",
          code: quotaCheck.code || "PAYMENT_REQUIRED",
          topupUrl: "/faturamento",
        },
        { status: 402 }
      )
    }
    chargedUid = auth.user.uid

    // 3. Invoke LLM. The deterministic fallback is development-only.
    let toonOutput = ""
    let processingSource: "llm" | "rag" | "fallback" = "llm"
    const allowDemoFallback =
      process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_FALLBACK !== "false"

    if (process.env.GEMINI_API_KEY) {
      try {
        const agentResult = await invokeAgent({
          inputData,
          inputType,
          ...(description?.trim() && { description: String(description).trim() }),
          ...(datatype?.trim() && { datatype: String(datatype).trim() }),
        })
        toonOutput = agentResult.toonOutput
        processingSource = agentResult.source
        retrieval = agentResult.retrieval
        retrievedContext = agentResult.retrievedContext
        usage = agentResult.usage
      } catch (agentError) {
        if (!allowDemoFallback) throw agentError
        const fallbackMock = getMockResult(inputData, inputType)
        toonOutput = fallbackMock.toonOutput
        processingSource = "fallback"
      }
    } else if (allowDemoFallback) {
      const fallbackMock = getMockResult(inputData, inputType)
      toonOutput = fallbackMock.toonOutput
      processingSource = "fallback"
    } else {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 1 })
      chargedUid = undefined
      return NextResponse.json(
        { error: "Motor Gemini não configurado", code: "GEMINI_API_KEY_MISSING" },
        { status: 503 }
      )
    }

    // 5. Parse TOON & Apply ECLASS 14.0 Calibration
    const parsed = parseToonOrchestrator(toonOutput)
    const primaryMapping = parsed.mappings[0]

    if (!primaryMapping) {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 1 })
      chargedUid = undefined
      return NextResponse.json(
        { error: "Nenhum mapeamento TOON válido retornado", raw: toonOutput },
        { status: 422 }
      )
    }

    const enriched = applyEclassFallback(
      primaryMapping.source,
      primaryMapping.eclassId,
      primaryMapping.target,
      primaryMapping.confidence,
      description
    )

    // 6. Physical & Dimensional Guardrail Check
    const physicalCheck = validatePhysicalDimensionalSafety({
      sourceTag: primaryMapping.source,
      description,
      dataType: datatype,
      eclassIrdi: enriched.eclassId,
      proposedUnit: enriched.unit,
    })

    const evidenceGate = assessEvidence({
      eclassIrdi: enriched.eclassId,
      candidates: retrievedContext,
    })
    const finalConfidence = Math.max(
      0.35,
      Number(
        (
          enriched.confidence -
          physicalCheck.confidencePenalty -
          evidenceGate.confidencePenalty
        ).toFixed(2)
      )
    )

    const eclassCandidates = getEclassCandidates(primaryMapping.source, description)
    const uncertaintyReasons = [...enriched.uncertaintyReasons]
    if (physicalCheck.warning) {
      uncertaintyReasons.push(physicalCheck.warning)
    }
    if (evidenceGate.reason) {
      uncertaintyReasons.push(evidenceGate.reason)
    }

    // 7. Automatically Enqueue in Firestore HITL Queue if Confidence < 0.85
    let hitlReviewId: string | undefined
    const requiresHitl = finalConfidence < 0.85 || evidenceGate.requireHumanReview
    if (requiresHitl) {
      const hitlRecord = await enqueueHitlReview({
        uid: auth.user.uid,
        assetId: primaryMapping.source,
        sourceTag: primaryMapping.source,
        rawDescription: description,
        dataType: datatype,
        inputType,
        suggestedEclassId: enriched.eclassId,
        suggestedTarget: enriched.target,
        suggestedUnit: physicalCheck.adjustedUnit,
        confidence: finalConfidence,
        uncertaintyReasons,
        eclassCandidates,
      })
      hitlReviewId = hitlRecord.id
    }

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        action: "Guardrail Industrial & Segurança",
        detail: "Contexto OT/IT validado e higienizado contra injeção.",
        timestamp: "0.10s",
      },
      {
        step: 2,
        action: "Inferência Semântica ECLASS 14.0",
        detail: `Mapeamento: ${primaryMapping.source} → ${enriched.eclassId} (${enriched.target})`,
        timestamp: "0.65s",
      },
      {
        step: 3,
        action: "Validação Dimensional & Física",
        detail: physicalCheck.warning
          ? physicalCheck.warning
          : `Unidade canônica UNECE validada: ${physicalCheck.adjustedUnit}`,
        timestamp: "0.85s",
      },
      {
        step: 4,
        action: requiresHitl ? "Encaminhamento Fila HITL" : "Auto-Aprovação IDTA v3.0",
        detail:
          !requiresHitl
            ? `Confiança ${(finalConfidence * 100).toFixed(0)}% >= 85%: Submodelos IDTA AAS v3.0 instanciados.`
            : evidenceGate.requireHumanReview
              ? `Gate de evidência exige revisão: Item #${hitlReviewId} registrado na fila HITL.`
              : `Confiança ${(finalConfidence * 100).toFixed(0)}% < 85%: Item #${hitlReviewId} registrado na fila HITL para revisão de engenharia.`,
        timestamp: "1.05s",
      },
    ]

    const toonMapping: MockToonMapping = {
      source: primaryMapping.source,
      target: enriched.target,
      eclassId: enriched.eclassId,
      action: "DirectMap",
      unit: physicalCheck.adjustedUnit,
    }

    // Build full IDTA AAS v3.0 JSON environment
    const aasJson = buildIdtaAASEnvironment({
      assetId: primaryMapping.source,
      variables: [
        {
          sourceTag: primaryMapping.source,
          description: description || enriched.target,
          dataType: datatype,
          eclassIrdi: enriched.eclassId,
          targetName: enriched.target,
          unit: physicalCheck.adjustedUnit,
          action: "DirectMap",
          confidence: finalConfidence,
        },
      ],
    })

    let interpretation: string | undefined
    if (process.env.GEMINI_API_KEY) {
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
        // ignore
      }
    }
    if (!interpretation) {
      interpretation = `Variável industrial '${primaryMapping.source}' (${
        inputType === "brownfield" ? "CLP / Rede de Campo" : "Endpoint CPS"
      }) alinhada à propriedade ECLASS ${enriched.eclassId} (${enriched.target}) com unidade ${
        physicalCheck.adjustedUnit
      }.`
    }

    const result: ProcessingResult & {
      source?: "llm" | "rag" | "fallback"
      retrieval?: AgentOutput["retrieval"]
      eclassCandidates?: Array<{ eclassId: string; target: string; unit: string; definition?: string }>
      interpretation?: string
      aasJson?: object
      evidenceGate?: ReturnType<typeof assessEvidence>
      usage?: AgentUsage
      providerCostEstimate?: ReturnType<typeof estimateProviderCost>
      requestId?: string
    } = {
      status: requiresHitl ? "warning" : "success",
      inputType,
      inputData: String(inputData).trim(),
      source: processingSource,
      retrieval,
      eclassCandidates,
      interpretation,
      reasoningSteps,
      toonOutput,
      toonMapping,
      confidence: finalConfidence,
      hitlReviewId,
      uncertaintyReasons,
      physicalWarning: physicalCheck.warning,
      evidenceGate,
      usage,
      providerCostEstimate: usage ? { ...estimateProviderCost(usage) } : undefined,
      requestId,
      remainingCredits: quotaCheck.profile.creditsBalance,
      aasJson,
      aasPreview: {
        idShort: primaryMapping.source.replace(/[^a-zA-Z0-9_]/g, "_"),
        semanticId: enriched.eclassId,
        valueType: datatype === "BOOL" ? "xs:boolean" : "xs:double",
        value: "dynamic",
        qualifiers: [{ type: "Unit", value: toonMapping.unit }],
      },
      processingTimeMs: Date.now() - startTime,
    }

    await recordUsageEvent({
      uid: auth.user.uid,
      operation: "mapping",
      requestId,
      inputType,
      source: processingSource,
      status: result.status,
      hitl: requiresHitl,
      latencyMs: result.processingTimeMs,
      usage: usage
        ? {
            geminiInputTokens: usage.geminiInputTokens,
            geminiOutputTokens: usage.geminiOutputTokens,
            geminiTotalTokens: usage.geminiTotalTokens,
            cohereSearchUnits: usage.cohereSearchUnits,
          }
        : undefined,
      providerCostEstimate: usage ? { ...estimateProviderCost(usage) } : undefined,
    }).catch((error) => {
      console.error("[api/orchestrator] Falha ao registrar usage_events", { requestId, error })
    })

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
        exportData: generateNodeRedFlow(result, {
          edgeToken: quotaCheck.profile.apiKey,
          platformUrl:
            process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000",
        }),
        exportFormat: "nodered",
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    if (chargedUid) {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 1 }).catch(() => {})
    }
    console.error("[api/orchestrator]", err)
    return NextResponse.json(
      { error: "Erro interno no motor de orquestração semântica" },
      { status: 500 }
    )
  }
}
