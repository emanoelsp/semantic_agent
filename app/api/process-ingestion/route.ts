import { NextRequest, NextResponse } from "next/server"
import { getMockResult, generateAASJson, generateNodeRedFlow } from "@/lib/mock-data"

// POST /api/process-ingestion
// Recebe dados de ingestao (tag PLC ou endpoint API) e retorna
// o resultado do processamento semantico mockado.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputData, inputType, exportFormat } = body as {
      inputData: string
      inputType: "brownfield" | "greenfield"
      exportFormat?: "aas" | "nodered"
    }

    if (!inputData || !inputType) {
      return NextResponse.json(
        { error: "Campos 'inputData' e 'inputType' sao obrigatorios" },
        { status: 400 }
      )
    }

    // Simular latencia de processamento LLM (1.5-2.5s)
    const delay = Math.floor(Math.random() * 1000) + 1500
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Obter resultado mock
    const result = getMockResult(inputData, inputType)

    // Se exportFormat foi solicitado, incluir dados de exportacao
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
        exportData: generateNodeRedFlow(result),
        exportFormat: "nodered",
      })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "Erro interno no processamento" },
      { status: 500 }
    )
  }
}
