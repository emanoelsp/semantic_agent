import { NextRequest, NextResponse } from "next/server"
import {
  registerUserAccount,
  loginUserAccount,
  authenticateRequest,
  rotateEdgeToken,
  publicUser,
} from "@/lib/firebase/admin"
import { authRequestSchema } from "@/lib/validation"

// GET /api/auth -> Returns current logged-in user profile and quota/payment status
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request)
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 })
  }
  return NextResponse.json({
    authenticated: true,
    user: publicUser(authResult.user),
  })
}

// POST /api/auth -> Register, Login, Logout, or Rotate API Key
export async function POST(request: NextRequest) {
  try {
    const parsed = authRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de autenticação inválido", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { action, email, password, displayName, company, firebaseIdToken } = parsed.data

    if (action === "logout") {
      const res = NextResponse.json({ ok: true })
      res.cookies.set("sa_session", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
      })
      return res
    }

    if (action === "rotate_token") {
      const authResult = await authenticateRequest(request)
      if (!authResult.authenticated || !authResult.user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
      }
      const newToken = await rotateEdgeToken(authResult.user.uid)
      return NextResponse.json({ apiKey: newToken })
    }

    if (action === "register") {
      if (!email || !password || password.length < 6) {
        return NextResponse.json(
          { error: "Informe um e-mail válido e uma senha com pelo menos 6 caracteres." },
          { status: 400 }
        )
      }
      const { user, sessionToken } = await registerUserAccount({
        email,
        password,
        displayName: displayName || email.split("@")[0]!,
        company,
      })
      const res = NextResponse.json({ authenticated: true, user: publicUser(user) })
      res.cookies.set("sa_session", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
      })
      return res
    }

    if (action === "login") {
      if (!email && !firebaseIdToken) {
        return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 })
      }
      const { user, sessionToken } = await loginUserAccount({
        email: email || "",
        password,
        firebaseIdToken,
      })
      const res = NextResponse.json({ authenticated: true, user: publicUser(user) })
      res.cookies.set("sa_session", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === "production",
      })
      return res
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro na autenticação"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
