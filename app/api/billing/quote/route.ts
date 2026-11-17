import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/guardrail"
import { quoteBilling } from "@/lib/pricing"
import { billingQuoteSchema } from "@/lib/validation"

/** Returns a non-binding customer quote. It never consumes credits. */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "billing-quote"
  const rate = checkRateLimit(ip, 60, 60_000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit excedido. Aguarde ${rate.resetInSeconds}s.` },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = billingQuoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados insuficientes para cotação", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  return NextResponse.json({ quote: quoteBilling(parsed.data) })
}
