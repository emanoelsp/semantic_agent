import { NextRequest, NextResponse } from "next/server"
import { invokeAgent } from "@/lib/agent"

// POST /api/agent
// Interface com o Gemini Pro - retorna string TOON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputData, inputType } = body as {
      inputData: string
      inputType?: "brownfield" | "greenfield"
    }

    if (!inputData || typeof inputData !== "string") {
      return NextResponse.json(
        { error: "Campo 'inputData' obrigatório e deve ser string" },
        { status: 400 }
      )
    }

    const result = await invokeAgent({ inputData, inputType })
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
