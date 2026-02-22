import { NextRequest, NextResponse } from "next/server"
import { validateIndustrialContext } from "@/lib/guardrail"

// POST /api/guardrail
// Analisa o payload de entrada e retorna 400 se fora do escopo industrial.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = validateIndustrialContext(body)

    if (!result.valid) {
      return NextResponse.json(
        { error: result.reason ?? "Payload inválido" },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true, message: "Contexto industrial válido" })
  } catch {
    return NextResponse.json(
      { error: "Payload inválido ou malformado" },
      { status: 400 }
    )
  }
}
