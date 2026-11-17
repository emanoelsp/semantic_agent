import { NextRequest, NextResponse } from "next/server"
import {
  authenticateRequest,
  listHitlReviews,
  resolveHitlReview,
} from "@/lib/firebase/admin"
import { findEclassEntry } from "@/lib/aas-v3"
import { hitlDecisionSchema } from "@/lib/validation"

// GET /api/hitl -> Lists HITL review queue items for the authenticated user
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 })
  }

  const url = new URL(request.url)
  const rawStatus = url.searchParams.get("status")
  const status = ["pending", "approved", "rejected"].includes(rawStatus || "")
    ? (rawStatus as "pending" | "approved" | "rejected")
    : undefined
  if (rawStatus && !status) {
    return NextResponse.json({ error: "Status HITL inválido" }, { status: 400 })
  }
  const items = await listHitlReviews(auth.user.uid, status)

  return NextResponse.json({ items })
}

// POST /api/hitl -> Approves or overrides a low-confidence semantic mapping
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 })
    }

    const parsed = hitlDecisionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Decisão HITL inválida", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { id, decision, finalEclassId, finalTarget, finalUnit } = parsed.data

    if (finalEclassId && !findEclassEntry(finalEclassId)) {
      return NextResponse.json(
        { error: "O IRDI final não existe no catálogo ECLASS local" },
        { status: 422 }
      )
    }

    const updated = await resolveHitlReview({
      id,
      uid: auth.user.uid,
      decision,
      finalEclassId,
      finalTarget,
      finalUnit,
      reviewedBy: auth.user.displayName || auth.user.email,
    })

    if (!updated) {
      return NextResponse.json({ error: "Item HITL não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ item: updated })
  } catch (err) {
    console.error("[api/hitl]", err)
    return NextResponse.json({ error: "Erro ao atualizar revisão HITL" }, { status: 500 })
  }
}
