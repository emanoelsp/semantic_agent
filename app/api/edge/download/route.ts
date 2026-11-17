import { NextResponse } from "next/server"
import { generateSealedNodeRedPackageZip } from "@/lib/edge-integrity"
import { authenticateRequest } from "@/lib/firebase/admin"
import { NextRequest } from "next/server"

// GET /api/edge/download -> Downloads the sealed, tamper-evident Node-RED contrib package (.zip)
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 })
    }
    const zipBuffer = await generateSealedNodeRedPackageZip()
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="node-red-contrib-industrial-semantic-agent-v1.0.0-sealed.zip"',
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[api/edge/download]", err)
    return NextResponse.json(
      { error: "Falha ao empacotar módulo Node-RED" },
      { status: 500 }
    )
  }
}
