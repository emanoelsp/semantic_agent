import { NextRequest, NextResponse } from "next/server"
import {
  buildIdtaAASEnvironment,
  generateAasxPackageBuffer,
  type AASEnvironmentV3,
} from "@/lib/aas-v3"
import { authenticateRequest, saveAssetPackage } from "@/lib/firebase/admin"

// POST /api/export-aasx -> Generates an IEC 63278-1 / IDTA-01005-3-0 `.aasx` binary package
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

    const aasxBuffer = await generateAasxPackageBuffer(env)

    const shell = env.assetAdministrationShells[0]
    await saveAssetPackage(
      {
        uid: auth.user.uid,
        assetId: assetId || shell?.idShort || "Asset",
        assetIdShort: shell?.idShort || "Asset",
        globalAssetId: shell?.assetInformation.globalAssetId || "urn:asset:01",
        mappingsCount: env.conceptDescriptions.length,
        aasJson: env,
      },
      aasxBuffer
    )

    const safeFilename = (assetId || sourceTag || "industrial-asset")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40)

    return new NextResponse(new Uint8Array(aasxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/asset-administration-shell-package+xml",
        "Content-Disposition": `attachment; filename="${safeFilename}.aasx"`,
      },
    })
  } catch (err) {
    console.error("[api/export-aasx]", err)
    return NextResponse.json(
      { error: "Erro ao empacotar arquivo AASX" },
      { status: 500 }
    )
  }
}
