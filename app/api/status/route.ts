import { NextResponse } from "next/server"

// GET /api/status
// Retorna se a API do Gemini está configurada (não expõe a chave)
export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY
  return NextResponse.json({
    geminiConfigured: hasKey,
  })
}
