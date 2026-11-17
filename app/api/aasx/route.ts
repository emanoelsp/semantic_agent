import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/firebase/admin"
import { buildIdtaAASEnvironment, type AASEnvironmentV3 } from "@/lib/aas-v3"

/**
 * POST /api/aasx
 *
 * Returns a standards-compliant AAS v3 JSON environment. The binary package
 * is intentionally kept in /api/export-aasx so consumers can choose between
 * JSON integration and a downloadable `.aasx` artifact.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 })
    }

    const body = await request.json()
    const { aasEnvironment, assetId, sourceTag, eclassIrdi, targetName, unit, confidence } = body as {
      aasEnvironment?: AASEnvironmentV3
      assetId?: string
      sourceTag?: string
      eclassIrdi?: string
      targetName?: string
      unit?: string
      confidence?: number
    }

    const env: AASEnvironmentV3 =
      aasEnvironment ||
      buildIdtaAASEnvironment({
        assetId: assetId || sourceTag || "IndustrialAsset_01",
        variables: [
          {
            sourceTag: sourceTag || "DB10.W2",
            eclassIrdi: eclassIrdi || "0173-1#02-BAA123#003",
            targetName: targetName || "Linear Velocity",
            unit: unit || "m/s",
            confidence: confidence ?? 0.92,
          },
        ],
      })

    return NextResponse.json(env, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Semantic-Agent-AASX-Endpoint": "/api/export-aasx",
        "X-Semantic-Agent-AASX-Content-Type":
          "application/asset-administration-shell-package+xml",
      },
    })
  } catch (err) {
    console.error("[api/aasx]", err)
    return NextResponse.json({ error: "Erro ao gerar ambiente AAS JSON" }, { status: 500 })
  }
}
