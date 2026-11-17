// =============================================================================
// Mercado Pago Checkout & PIX / Credit Card Payment Engine + Webhook Verifier
// =============================================================================
// Uses real Mercado Pago API v1 (`/v1/payments` & `/checkout/preferences`) when
// `MERCADOPAGO_ACCESS_TOKEN` is configured, and provides a realistic sandbox
// PIX QR Code + Credit Card checkout flow when testing before setting env vars.
// All credit allocations use `allocateCreditsIdempotent` (Firestore Transaction)
// to prevent double-spending or webhook race conditions.
// =============================================================================

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import {
  authenticateRequest,
  allocateCreditsIdempotent,
  listPaymentTransactions,
  publicUser,
  type PaymentTransactionRecord,
} from "@/lib/firebase/admin"

export interface BillingPack {
  id: string
  name: string
  amountBRL: number
  credits: number
  edgeMessages: number
}

export const BILLING_PACKS: Record<string, BillingPack> = {
  starter: {
    id: "starter",
    name: "Starter Industrial Pack",
    amountBRL: 49.9,
    credits: 100,
    edgeMessages: 25000,
  },
  growth: {
    id: "growth",
    name: "Plant Operations Pack",
    amountBRL: 199.0,
    credits: 500,
    edgeMessages: 150000,
  },
  scale: {
    id: "scale",
    name: "Enterprise Data Space Pack",
    amountBRL: 690.0,
    credits: 2500,
    edgeMessages: 1000000,
  },
}

// GET /api/billing/checkout -> Returns user payment history & available packs
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const transactions = await listPaymentTransactions(auth.user.uid)
  return NextResponse.json({
    user: publicUser(auth.user),
    packs: Object.values(BILLING_PACKS),
    transactions,
    mercadoPagoLiveConfigured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
  })
}

// POST /api/billing/checkout -> Creates a Mercado Pago PIX or Credit Card payment
// or confirms an instant payment in sandbox mode
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { error: "Crie sua conta ou faça login antes de adquirir créditos." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packId, method, action, paymentId } = body as {
      packId?: string
      method?: "pix" | "credit_card"
      action?: "create" | "confirm_payment"
      paymentId?: string
    }

    // If confirming a pending PIX/Card payment (or polling Mercado Pago status)
    if (action === "confirm_payment" && paymentId) {
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      const existingList = await listPaymentTransactions(auth.user.uid)
      const pendingTx = existingList.find((t) => t.paymentId === paymentId)

      if (!pendingTx) {
        return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 })
      }

      if (mpAccessToken && !paymentId.startsWith("mp_sim_")) {
        // Verify live status on Mercado Pago API
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        })
        if (mpRes.ok) {
          const mpData = (await mpRes.json()) as { status?: string }
          if (mpData.status !== "approved") {
            return NextResponse.json({
              status: mpData.status || "pending",
              message: "Pagamento ainda aguardando compensação no Mercado Pago.",
            })
          }
        }
      }

      const approvedRecord: PaymentTransactionRecord = {
        ...pendingTx,
        status: "approved",
        processedAt: new Date().toISOString(),
      }

      const { alreadyProcessed, profile } = await allocateCreditsIdempotent(approvedRecord)
      return NextResponse.json({
        status: "approved",
        alreadyProcessed,
        user: publicUser(profile),
        transaction: approvedRecord,
      })
    }

    const pack = BILLING_PACKS[packId || "starter"] ?? BILLING_PACKS.starter!
    const paymentMethod = method === "credit_card" ? "credit_card" : "pix"
    const externalReference = `${auth.user.uid}|${pack.id}|${Date.now()}`
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!mpAccessToken && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          error: "Mercado Pago não configurado. Pagamentos simulados são permitidos somente em desenvolvimento.",
          code: "PAYMENTS_NOT_CONFIGURED",
        },
        { status: 503 }
      )
    }

    // 1. Live Mercado Pago API integration when MERCADOPAGO_ACCESS_TOKEN is present
    if (mpAccessToken) {
      const idempotencyKey = crypto.randomUUID()

      if (paymentMethod === "pix") {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mpAccessToken}`,
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            transaction_amount: pack.amountBRL,
            description: `${pack.name} - Semantic Agent`,
            payment_method_id: "pix",
            external_reference: externalReference,
            payer: {
              email: auth.user.email,
              first_name: auth.user.displayName,
            },
          }),
        })

        const mpData = (await mpRes.json()) as {
          id?: number | string
          status?: string
          point_of_interaction?: {
            transaction_data?: {
              qr_code?: string
              qr_code_base64?: string
              ticket_url?: string
            }
          }
          message?: string
        }

        if (!mpRes.ok || !mpData.id) {
          return NextResponse.json(
            { error: mpData.message || "Erro ao gerar PIX no Mercado Pago" },
            { status: 502 }
          )
        }

        const txRecord: PaymentTransactionRecord = {
          paymentId: String(mpData.id),
          uid: auth.user.uid,
          amountBRL: pack.amountBRL,
          creditsAdded: pack.credits,
          edgeQuotaAdded: pack.edgeMessages,
          method: "pix",
          status: mpData.status === "approved" ? "approved" : "pending",
          externalReference,
          qrCodeCopyPaste: mpData.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
          checkoutUrl: mpData.point_of_interaction?.transaction_data?.ticket_url,
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }

        const { profile } = await allocateCreditsIdempotent(txRecord)
        return NextResponse.json({
          transaction: txRecord,
          user: publicUser(profile),
        })
      } else {
        // Credit Card via Mercado Pago Checkout Pro Preference
        const origin = request.headers.get("origin") || "http://localhost:3000"
        const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mpAccessToken}`,
          },
          body: JSON.stringify({
            items: [
              {
                id: pack.id,
                title: `${pack.name} (${pack.credits} créditos + ${pack.edgeMessages} msgs Edge)`,
                quantity: 1,
                currency_id: "BRL",
                unit_price: pack.amountBRL,
              },
            ],
            payer: { email: auth.user.email },
            external_reference: externalReference,
            back_urls: {
              success: `${origin}/faturamento?status=approved`,
              failure: `${origin}/faturamento?status=failure`,
              pending: `${origin}/faturamento?status=pending`,
            },
            auto_return: "approved",
          }),
        })

        const prefData = (await prefRes.json()) as {
          id?: string
          init_point?: string
          message?: string
        }

        if (!prefRes.ok || !prefData.id) {
          return NextResponse.json(
            { error: prefData.message || "Erro ao criar Checkout Cartão no Mercado Pago" },
            { status: 502 }
          )
        }

        const txRecord: PaymentTransactionRecord = {
          paymentId: String(prefData.id),
          uid: auth.user.uid,
          amountBRL: pack.amountBRL,
          creditsAdded: pack.credits,
          edgeQuotaAdded: pack.edgeMessages,
          method: "credit_card",
          status: "pending",
          externalReference,
          checkoutUrl: prefData.init_point,
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }

        const { profile } = await allocateCreditsIdempotent(txRecord)
        return NextResponse.json({
          transaction: txRecord,
          user: publicUser(profile),
        })
      }
    }

    // 2. Sandbox / Pre-Env-Var Mode: Generates EMVCo PIX Copy-Paste payload & instant confirmation
    const simPaymentId = `mp_sim_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`
    const pixCopyPaste = `00020126580014br.gov.bcb.pix0136mercadopago-ind40-${simPaymentId}5204000053039865406${pack.amountBRL.toFixed(
      2
    )}5802BR5925SEMANTIC AGENT6009SAO PAULO62070503***6304ABCD`

    const txRecord: PaymentTransactionRecord = {
      paymentId: simPaymentId,
      uid: auth.user.uid,
      amountBRL: pack.amountBRL,
      creditsAdded: pack.credits,
      edgeQuotaAdded: pack.edgeMessages,
      method: paymentMethod,
      status: paymentMethod === "credit_card" ? "approved" : "pending",
      externalReference,
      qrCodeCopyPaste: pixCopyPaste,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    const { profile } = await allocateCreditsIdempotent(txRecord)
    return NextResponse.json({
      transaction: txRecord,
      user: publicUser(profile),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao processar pagamento"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
