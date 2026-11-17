// =============================================================================
// Edge Licensing & Tamper-Evident Handshake Endpoint (/api/edge/license)
// =============================================================================
// Validates:
// 1. Cryptographic SHA-256 integrity of `semantic-plc-mapper.js` + HMAC-SHA256
//    request signature. If the user opens and alters the Node-RED code, the
//    hash changes and communication is immediately rejected (HTTP 403).
// 2. Paid license activation (`hasPaidAccess === true`) and atomic deduction
//    of `edgeTelemetryQuota` in Firestore.
// 3. Returns a server-signed 24h lease token so the edge node can survive
//    temporary factory internet drops.
// =============================================================================

import { NextRequest, NextResponse } from "next/server"
import { consumeQuotaTransactional } from "@/lib/firebase/admin"
import {
  verifyEdgeRequestIntegrity,
  createServerLeaseSignature,
  buildProtectedNodeRedRuntimeSource,
} from "@/lib/edge-integrity"
import { authenticateRequest } from "@/lib/firebase/admin"

export async function GET() {
  const { canonicalIntegrityHash } = buildProtectedNodeRedRuntimeSource()
  return NextResponse.json({
    package: "node-red-contrib-industrial-semantic-agent",
    version: "1.0.0",
    canonicalIntegrityHash,
    tamperProtection: "HMAC-SHA256 + Self-Hashing VM Seal",
    downloadUrl: "/api/edge/download",
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody || "{}") as {
      edgeToken?: string
      nodeId?: string
      plcVendor?: string
      sourceTag?: string
      eclassIrdi?: string
      consumeMessages?: number
      timestamp?: number
      runtimeHash?: string
      fileSelfHash?: string
      uiSimulator?: boolean
    }

    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
    const edgeToken = (body.edgeToken || bearerToken).trim()

    if (!edgeToken) {
      return NextResponse.json(
        {
          allowed: false,
          code: "MISSING_TOKEN",
          error: "Token de licença Edge não informado.",
          topupUrl: "/faturamento?reason=missing_token",
        },
        { status: 401 }
      )
    }

    const runtimeHashHeader = request.headers.get("x-runtime-integrity") || body.runtimeHash || ""
    const signatureHeader = request.headers.get("x-edge-signature") || ""
    const timestamp = Number(request.headers.get("x-edge-timestamp") || body.timestamp || 0)

    // The simulator bypass is only available to an authenticated dashboard
    // session; a public body flag must never disable the integrity check.
    const simulatorAuth = body.uiSimulator ? await authenticateRequest(request) : null
    const isAuthorizedSimulator = Boolean(simulatorAuth?.authenticated && simulatorAuth.user)
    if (!isAuthorizedSimulator) {
      const integrity = verifyEdgeRequestIntegrity({
        edgeToken,
        timestamp,
        runtimeHashHeader,
        signatureHeader,
        rawBody,
        fileSelfHash: body.fileSelfHash,
      })

      if (!integrity.valid) {
        return NextResponse.json(
          {
            allowed: false,
            code: "INTEGRITY_TAMPERED",
            error:
              integrity.reason ||
              "Código do pacote Node-RED foi alterado. Comunicação com o Agente Semântico bloqueada.",
          },
          { status: 403 }
        )
      }
    } else if (body.fileSelfHash === "TAMPERED_DEMO") {
      return NextResponse.json(
        {
          allowed: false,
          code: "INTEGRITY_TAMPERED",
          error:
            "Simulação de Adulteração Detectada: O hash SHA-256 do arquivo semantic-plc-mapper.js divergiu do selo oficial. Comunicação recusada pelo Agente Semântico.",
        },
        { status: 403 }
      )
    }

    const consumeCount = Math.max(0, Math.min(5000, Number(body.consumeMessages ?? 1)))
    const quotaResult = await consumeQuotaTransactional({
      edgeToken,
      edgeMessagesToConsume: consumeCount,
    })

    if (!quotaResult.allowed || !quotaResult.profile) {
      return NextResponse.json(
        {
          allowed: false,
          code: quotaResult.code || "PAYMENT_REQUIRED",
          error: quotaResult.reason || "Licença sem saldo ou pagamento pendente.",
          remainingEdgeQuota: quotaResult.profile?.edgeTelemetryQuota ?? 0,
          topupUrl: `/faturamento?reason=${quotaResult.code || "quota_depleted"}`,
        },
        { status: quotaResult.code === "AUTH_REQUIRED" ? 401 : 402 }
      )
    }

    const leaseExpiresAt = Date.now() + 24 * 60 * 60 * 1000
    const leaseSignature = createServerLeaseSignature(
      edgeToken,
      quotaResult.profile.edgeTelemetryQuota,
      leaseExpiresAt
    )

    return NextResponse.json({
      allowed: true,
      uid: quotaResult.profile.uid,
      plan: quotaResult.profile.plan,
      remainingEdgeQuota: quotaResult.profile.edgeTelemetryQuota,
      remainingCredits: quotaResult.profile.creditsBalance,
      leaseExpiresAt,
      leaseSignature,
    })
  } catch (err) {
    console.error("[api/edge/license]", err)
    return NextResponse.json(
      { allowed: false, error: "Erro interno no servidor de licenciamento Edge" },
      { status: 500 }
    )
  }
}
