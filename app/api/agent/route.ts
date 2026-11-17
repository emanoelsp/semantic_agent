import { NextRequest, NextResponse } from "next/server"
import { invokeAgent } from "@/lib/agent"
import { semanticMappingRequestSchema } from "@/lib/validation"

// POST /api/agent
// Interface com o Gemini Pro - retorna string TOON
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Endpoint interno desativado. Use /api/orchestrator.", code: "INTERNAL_ENDPOINT" },
        { status: 410 }
      )
    }

    const parsed = semanticMappingRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
    }

    const result = await invokeAgent(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[api/agent]", err)
    const message = err instanceof Error ? err.message : "Erro na chamada ao Gemini"
    if (message.includes("GEMINI_API_KEY")) {
      return NextResponse.json({ error: message }, { status: 500 })
    }
    return NextResponse.json(
      { error: `Falha no agente LLM: ${message}` },
      { status: 502 }
    )
  }
}
