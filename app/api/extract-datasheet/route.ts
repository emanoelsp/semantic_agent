import { NextRequest, NextResponse } from "next/server"
import { validateIndustrialContext, checkRateLimit } from "@/lib/guardrail"
import {
  extractDatasheetPayloadFromPdf,
  invokeAgentForDatasheetPayload,
  type DatasheetPayload,
} from "@/lib/datasheet-agent"
import { parseToonOrchestrator } from "@/lib/toon-orchestrator-parser"
import { generateAASFromDatasheetMappings } from "@/lib/aas-datasheet"
import { getEclassCandidates } from "@/lib/eclass-fallback"
import {
  type ProcessingResult,
  type ReasoningStep,
  type ToonMapping,
} from "@/lib/mock-data"
import { getInterpretation } from "@/lib/interpretation"
import {
  authenticateRequest,
  consumeQuotaTransactional,
  enqueueHitlReview,
  refundQuotaTransactional,
  saveAssetPackage,
} from "@/lib/firebase/admin"
import { generateAasxPackageBuffer } from "@/lib/aas-v3"
import { datasheetMetadataSchema } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let chargedUid: string | undefined

  try {
    const ip = request.headers.get("x-forwarded-for") || "local-client"
    const rate = checkRateLimit(ip, 15, 60_000)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit excedido. Aguarde ${rate.resetInSeconds}s.` },
        { status: 429 }
      )
    }

    // Validate the upload before authentication/charging.
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Envie um arquivo PDF válido" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0 || buffer.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: buffer.length === 0 ? "PDF vazio" : "PDF muito grande (máx. 20 MB)" },
        { status: buffer.length === 0 ? 400 : 413 }
      )
    }
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json({ error: "O arquivo não possui uma assinatura PDF válida" }, { status: 400 })
    }

    // 1. Authenticate & Enforce Paid Access (2 credits per full PDF datasheet extraction)
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        {
          error: "Autenticação obrigatória. Crie sua conta e faça login para extrair datasheets.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      )
    }

    const quotaCheck = await consumeQuotaTransactional({
      uid: auth.user.uid,
      creditsToConsume: 2,
    })

    if (!quotaCheck.allowed || !quotaCheck.profile) {
      return NextResponse.json(
        {
          error:
            quotaCheck.reason ||
            "Pagamento necessário: A extração automática de Datasheet PDF consome 2 créditos. Ative o Pay-as-you-go via Mercado Pago.",
          code: quotaCheck.code || "PAYMENT_REQUIRED",
          topupUrl: "/faturamento",
        },
        { status: 402 }
      )
    }
    chargedUid = auth.user.uid
    const pdfBase64 = buffer.toString("base64")

    let payload: DatasheetPayload
    let toonOutput: string

    const allowDemoFallback =
      process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_FALLBACK !== "false"
    let processingSource: "llm" | "rag" | "fallback" = "llm"

    if (process.env.GEMINI_API_KEY) {
      try {
        payload = await extractDatasheetPayloadFromPdf(pdfBase64)
        payload = datasheetMetadataSchema.parse(payload)
        toonOutput = await invokeAgentForDatasheetPayload(payload)
      } catch (extractErr) {
        if (allowDemoFallback) {
          payload = {
            asset_id: file.name.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "industrial_asset",
            manufacturer_name: "Unknown manufacturer",
            product_designation: file.name.replace(/\.pdf$/i, ""),
            target_standard: "ECLASS_14.0",
            data_points: [
              { source_tag: "UNKNOWN_01", description: "Industrial variable requiring engineering review", data_type: "REAL", unit: "unitless" },
            ],
          }
          toonOutput = "⟨MAP_START⟩⟨SRC:UNKNOWN_01⟩⟨TGT:UNKNOWN⟩⟨CONF:0.50⟩⟨MAP_END⟩"
          processingSource = "fallback"
        } else {
          await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 2 })
          chargedUid = undefined
          const msg = extractErr instanceof Error ? extractErr.message : "Falha ao extrair payload"
          return NextResponse.json({ error: msg, code: "EXTRACT_ERROR" }, { status: 502 })
        }
      }
    } else if (allowDemoFallback) {
      // Structured industrial fallback when testing locally before GEMINI_API_KEY is added
      payload = {
        asset_id: file.name.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "Siemens_S7_1500_Station01",
        manufacturer_name: "Siemens AG / Industrial Automation",
        product_designation: file.name.replace(/\.pdf$/i, ""),
        serial_number: "SN-IND40-2026",
        year_of_construction: "2026",
        target_standard: "ECLASS_14.0",
        data_points: [
          { source_tag: "I1", description: "Phototransistor light barrier sensor", data_type: "BOOL", unit: "boolean" },
          { source_tag: "I2", description: "Limit switch end position", data_type: "BOOL", unit: "boolean" },
          { source_tag: "Q1", description: "Conveyor drive motor forward actuation", data_type: "BOOL", unit: "boolean" },
          { source_tag: "DB10.W2", description: "Linear conveyor belt velocity", data_type: "REAL", unit: "m/s" },
          { source_tag: "Mtr_Tmp_01", description: "Main spindle bearing temperature", data_type: "REAL", unit: "degC" },
        ],
      }
      toonOutput =
        "⟨MAP_START⟩⟨SRC:I1⟩⟨TGT:ECLASS:0173-1#02-BAA014#002⟩⟨CONF:0.95⟩⟨MAP_END⟩" +
        "⟨MAP_START⟩⟨SRC:I2⟩⟨TGT:ECLASS:0173-1#02-BAA283#002⟩⟨CONF:0.93⟩⟨MAP_END⟩" +
        "⟨MAP_START⟩⟨SRC:Q1⟩⟨TGT:ECLASS:0173-1#02-BAB014#005⟩⟨CONF:0.96⟩⟨MAP_END⟩" +
        "⟨MAP_START⟩⟨SRC:DB10.W2⟩⟨TGT:ECLASS:0173-1#02-BAA123#003⟩⟨CONF:0.92⟩⟨MAP_END⟩" +
        "⟨MAP_START⟩⟨SRC:Mtr_Tmp_01⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.94⟩⟨MAP_END⟩" +
        "⟨ACTION:GENERATE_NODE_RED⟩"
      processingSource = "fallback"
    } else {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 2 })
      chargedUid = undefined
      return NextResponse.json(
        { error: "Motor Gemini não configurado", code: "GEMINI_API_KEY_MISSING" },
        { status: 503 }
      )
    }

    const sampleText = payload.data_points
      .map((dp) => `${dp.source_tag} ${dp.description}`)
      .join(" ")
    const guardrailResult = validateIndustrialContext({ inputData: sampleText })
    if (!guardrailResult.valid) {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 2 })
      chargedUid = undefined
      return NextResponse.json(
        { error: guardrailResult.reason ?? "Conteúdo fora do escopo industrial" },
        { status: 400 }
      )
    }

    const parsed = parseToonOrchestrator(toonOutput)
    if (parsed.mappings.length === 0) {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 2 })
      chargedUid = undefined
      return NextResponse.json(
        { error: "Nenhum mapeamento TOON válido", raw: toonOutput },
        { status: 422 }
      )
    }

    const descriptionMap = new Map(payload.data_points.map((dp) => [dp.source_tag, dp.description]))
    const dataTypeMap = new Map(payload.data_points.map((dp) => [dp.source_tag, dp.data_type]))
    const unitMap = new Map(payload.data_points.map((dp) => [dp.source_tag, dp.unit]))

    const datasheetMappings = parsed.mappings.map((m) => ({
      ...m,
      description: descriptionMap.get(m.source),
      dataType: dataTypeMap.get(m.source),
      unit: unitMap.get(m.source),
    }))

    // Enqueue any low-confidence datasheet variables (< 0.85) into HITL queue
    for (const dm of datasheetMappings) {
      if ((dm.confidence ?? 0.9) < 0.85) {
        await enqueueHitlReview({
          uid: auth.user.uid,
          assetId: payload.asset_id,
          sourceTag: dm.source,
          rawDescription: dm.description,
          dataType: dm.dataType,
          inputType: "datasheet",
          suggestedEclassId: dm.eclassId,
          suggestedTarget: dm.target,
          suggestedUnit: dm.unit || "unitless",
          confidence: dm.confidence ?? 0.78,
          uncertaintyReasons: ["Variável de datasheet com confiança abaixo de 85%."],
          eclassCandidates: getEclassCandidates(dm.source, dm.description),
        })
      }
    }

    const assetIdShort = payload.asset_id.split("_").slice(-2).join("_") || payload.asset_id
    const aasJson = generateAASFromDatasheetMappings(
      payload.asset_id,
      assetIdShort,
      datasheetMappings,
      payload.data_points,
      {
        manufacturerName: payload.manufacturer_name,
        productDesignation: payload.product_designation,
        serialNumber: payload.serial_number,
        yearOfConstruction: payload.year_of_construction,
      }
    )

    // Persist AASX package to Firebase Storage / Firestore
    const aasxBuf = await generateAasxPackageBuffer(aasJson).catch(() => undefined)
    await saveAssetPackage(
      {
        uid: auth.user.uid,
        assetId: payload.asset_id,
        assetIdShort,
        globalAssetId: aasJson.assetAdministrationShells[0]?.assetInformation.globalAssetId || payload.asset_id,
        mappingsCount: datasheetMappings.length,
        aasJson,
      },
      aasxBuf
    ).catch(() => {})

    const primary = parsed.mappings[0]!
    const toonMapping: ToonMapping = {
      source: primary.source,
      target: primary.target,
      eclassId: primary.eclassId,
      action: "DirectMap",
      unit: unitMap.get(primary.source) || "boolean",
    }

    let interpretation: string | undefined
    if (process.env.GEMINI_API_KEY) {
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
        // ignore
      }
    }
    if (!interpretation) {
      interpretation = `Ativo '${payload.asset_id}' (${payload.manufacturer_name || "OEM Industrial"}) processado com ${datasheetMappings.length} variáveis mapeadas para os submodelos IDTA Nameplate, TechnicalData, OperationalCapabilities e OperationalData.`
    }

    const reasoningSteps: ReasoningStep[] = [
      { step: 1, action: "Ingestão Datasheet PDF", detail: `Ativo ${payload.asset_id} (${payload.data_points.length} variáveis extraídas)`, timestamp: "0.5s" },
      { step: 2, action: "Alinhamento Semântico ECLASS 14.0", detail: `${parsed.mappings.length} tags mapeadas com ConceptDescriptions IEC 61360`, timestamp: "1.2s" },
      { step: 3, action: "Empacotamento IDTA AAS v3.0 & AASX", detail: "Submodelos Nameplate, TechnicalData, Capabilities e OperationalData gerados", timestamp: "1.6s" },
    ]

    const result: ProcessingResult & {
      source?: "llm" | "rag" | "fallback"
      datasheetPayload?: DatasheetPayload
      datasheetMappings?: typeof datasheetMappings
      aasJson?: object
      interpretation?: string
    } = {
      status: "success",
      inputType: "brownfield",
      inputData: payload.asset_id,
      source: processingSource,
      reasoningSteps,
      toonOutput,
      toonMapping,
      confidence: 0.95,
      remainingCredits: quotaCheck.profile.creditsBalance,
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
      interpretation,
    }

    return NextResponse.json(result)
  } catch (err) {
    if (chargedUid) {
      await refundQuotaTransactional({ uid: chargedUid, creditsToRefund: 2 }).catch(() => {})
    }
    console.error("[api/extract-datasheet]", err)
    return NextResponse.json(
      { error: "Erro ao processar datasheet PDF" },
      { status: 500 }
    )
  }
}
