// =============================================================================
// Mercado Pago Webhook Endpoint (/api/webhooks/mercadopago)
// =============================================================================
// 1. Validates `x-signature` HMAC-SHA256 from Mercado Pago (`ts=...,v1=...`)
//    when `MERCADOPAGO_WEBHOOK_SECRET` is configured.
// 2. Fetches the authoritative payment state from Mercado Pago API.
// 3. Uses `allocateCreditsIdempotent` (Firestore Transaction) to guarantee
//    that duplicate or concurrent webhooks never credit a user twice.
// =============================================================================

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import {
  allocateCreditsIdempotent,
  type PaymentTransactionRecord,
} from "@/lib/firebase/admin"
import { BILLING_PACKS } from "@/app/api/billing/checkout/route"

function verifyMercadoPagoWebhookSignature(
  request: NextRequest,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"

  const xSignature = request.headers.get("x-signature") || ""
  const xRequestId = request.headers.get("x-request-id") || ""

  const parts = Object.fromEntries(
    xSignature.split(",").map((kv) => {
      const [k, v] = kv.trim().split("=")
      return [k, v]
    })
  ) as { ts?: string; v1?: string }

  if (!parts.ts || !parts.v1) return false

  const timestamp = Number(parts.ts)
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return false
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex")

  return (
    expected.length === parts.v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  )
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const body = (await request.json().catch(() => ({}))) as {
      type?: string
      action?: string
      data?: { id?: string | number }
      uid?: string
      packId?: string
      paymentId?: string
    }

    const dataId = String(
      body.data?.id || url.searchParams.get("data.id") || body.paymentId || ""
    )

    if (!dataId) {
      return NextResponse.json({ error: "Missing payment data.id" }, { status: 400 })
    }

    if (!verifyMercadoPagoWebhookSignature(request, dataId)) {
      return NextResponse.json(
        { error: "Invalid Mercado Pago webhook x-signature" },
        { status: 401 }
      )
    }

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    let uid = body.uid || ""
    let packId = body.packId || "starter"
    let status: "approved" | "pending" | "rejected" = "approved"
    let method: "pix" | "credit_card" = "pix"
    let amountBRL = BILLING_PACKS.starter!.amountBRL

    if (mpAccessToken && !dataId.startsWith("mp_sim_")) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      })
      if (!mpRes.ok) {
        return NextResponse.json(
          { error: "Failed to verify payment with Mercado Pago API" },
          { status: 502 }
        )
      }
      const mpPayment = (await mpRes.json()) as {
        status?: string
        payment_method_id?: string
        transaction_amount?: number
        external_reference?: string
      }

      status =
        mpPayment.status === "approved"
          ? "approved"
          : mpPayment.status === "rejected"
            ? "rejected"
            : "pending"
      method = mpPayment.payment_method_id === "pix" ? "pix" : "credit_card"
      const refParts = (mpPayment.external_reference || "").split("|")
      uid = refParts[0] || uid
      packId = refParts[1] || packId
      amountBRL = mpPayment.transaction_amount ?? amountBRL
    }

    if (!uid) {
      return NextResponse.json(
        { error: "Unable to resolve user UID from external_reference" },
        { status: 400 }
      )
    }

    const pack = BILLING_PACKS[packId] ?? BILLING_PACKS.starter!
    const record: PaymentTransactionRecord = {
      paymentId: dataId,
      uid,
      amountBRL,
      creditsAdded: pack.credits,
      edgeQuotaAdded: pack.edgeMessages,
      method,
      status,
      externalReference: `${uid}|${pack.id}`,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    const { alreadyProcessed, profile } = await allocateCreditsIdempotent(record)

    return NextResponse.json({
      received: true,
      paymentId: dataId,
      alreadyProcessed,
      creditsBalance: profile.creditsBalance,
      edgeTelemetryQuota: profile.edgeTelemetryQuota,
    })
  } catch (err) {
    console.error("[api/webhooks/mercadopago]", err)
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    )
  }
}
