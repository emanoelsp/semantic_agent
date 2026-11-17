// =============================================================================
// Firebase Admin SDK & Transactional Persistence Layer (Auth + Billing + HITL)
// =============================================================================
// Supports real Firebase Auth, Firestore & Storage when environment variables
// are configured, plus a zero-config persistent local store (backed by disk +
// memory) so account creation, password login, Pay-as-you-go payment unlock,
// and Node-RED tamper-evident licensing work immediately out of the box.
// =============================================================================

import { getApps, initializeApp, cert, type App } from "firebase-admin/app"
import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getStorage as getAdminStorage, type Storage as AdminStorage } from "firebase-admin/storage"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import os from "os"

// All Firestore collections owned by this product share one namespace prefix.
// This prevents collisions when the Firebase project is reused by other apps.
const FIRESTORE_COLLECTIONS = {
  users: "semantic_agent_users",
  usageEvents: "semantic_agent_usage_events",
  paymentTransactions: "semantic_agent_payment_transactions",
  hitlReviews: "semantic_agent_hitl_reviews",
  aasPackages: "semantic_agent_aas_packages",
} as const

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  company?: string
  passwordHash?: string // Used when Firebase Client Auth env vars are not yet set
  plan: "unpaid" | "pay_as_you_go" | "enterprise"
  hasPaidAccess: boolean // Strict requirement: Semantic Agent API only works after payment
  creditsBalance: number // 1 credit = 1 datasheet/variable mapping call
  edgeTelemetryQuota: number // Remaining Node-RED edge messages
  apiKey: string // Edge & API license token (sk_edge_ind40_...)
  createdAt: string
  updatedAt: string
}

export interface SessionTokenPayload {
  uid: string
  email: string
  exp: number
}

export interface HitlReviewItem {
  id: string
  uid: string
  assetId: string
  sourceTag: string
  rawDescription?: string
  dataType?: string
  inputType: "brownfield" | "greenfield" | "datasheet"
  suggestedEclassId: string
  suggestedTarget: string
  suggestedUnit: string
  confidence: number
  uncertaintyReasons: string[]
  eclassCandidates: Array<{ eclassId: string; target: string; unit: string; definition?: string }>
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewedAt?: string
  finalEclassId?: string
  finalTarget?: string
  finalUnit?: string
  createdAt: string
}

export interface PaymentTransactionRecord {
  paymentId: string
  uid: string
  amountBRL: number
  creditsAdded: number
  edgeQuotaAdded: number
  method: "pix" | "credit_card"
  status: "pending" | "approved" | "rejected"
  externalReference: string
  qrCodeBase64?: string
  qrCodeCopyPaste?: string
  checkoutUrl?: string
  processedAt: string
  createdAt: string
}

export interface AssetPackageRecord {
  id: string
  uid: string
  assetId: string
  assetIdShort: string
  globalAssetId: string
  mappingsCount: number
  aasJson: object
  storageUrlAasx?: string
  storageUrlPdf?: string
  createdAt: string
}

export interface UsageEventRecord {
  id: string
  uid: string
  operation: "mapping" | "datasheet" | "telemetry"
  requestId: string
  inputType?: string
  source?: string
  status: "success" | "warning" | "error"
  hitl: boolean
  latencyMs: number
  usage?: Record<string, number>
  providerCostEstimate?: Record<string, unknown>
  createdAt: string
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "development-only-session-secret")

function getSessionSecret(): string {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET é obrigatória em produção")
  }
  return SESSION_SECRET
}

const LOCAL_DB_FILE = path.join(os.tmpdir(), "industrial-semantic-agent-store.json")

interface LocalStoreData {
  users: Record<string, UserProfile>
  hitlQueue: Record<string, HitlReviewItem>
  payments: Record<string, PaymentTransactionRecord>
  assets: Record<string, AssetPackageRecord>
  usageEvents: UsageEventRecord[]
}

function loadLocalStore(): LocalStoreData {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8")
      const parsed = JSON.parse(raw) as LocalStoreData
      if (parsed && parsed.users) return parsed
    }
  } catch {
    // ignore
  }
  return { users: {}, hitlQueue: {}, payments: {}, assets: {}, usageEvents: [] }
}

function saveLocalStore(data: LocalStoreData): void {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch {
    // ignore
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const derived = crypto.scryptSync(password, salt, 64)
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (storedHash.startsWith("scrypt$")) {
      const [, saltHex, digestHex] = storedHash.split("$")
      if (!saltHex || !digestHex) return false
      const expected = Buffer.from(digestHex, "hex")
      const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
    }

    // Backwards-compatible verification for development records created by the
    // previous implementation. New records always use scrypt with a salt.
    const legacy = crypto.pbkdf2Sync(password, getSessionSecret(), 10000, 32, "sha256").toString("hex")
    return legacy.length === storedHash.length && crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(storedHash))
  } catch {
    return false
  }
}

export function createSessionToken(uid: string, email: string): string {
  const payload: SessionTokenPayload = {
    uid,
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(base64Payload)
    .digest("base64url")
  return `${base64Payload}.${sig}`
}

export function verifySessionToken(token?: string | null): SessionTokenPayload | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [base64Payload, sig] = parts as [string, string]
  let expectedSig: string
  try {
    expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(base64Payload)
      .digest("base64url")
  } catch {
    return null
  }
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) return null
  try {
    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf-8")) as SessionTokenPayload
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  )
}

let adminApp: App | null = null

export function getFirebaseAdmin(): {
  app: App | null
  db: Firestore | null
  auth: Auth | null
  storage: AdminStorage | null
} {
  if (!isFirebaseAdminConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Firebase Admin não configurado. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY são obrigatórios em produção."
      )
    }
    return { app: null, db: null, auth: null, storage: null }
  }

  try {
    if (!adminApp) {
      const existing = getApps()
      if (existing.length > 0) {
        adminApp = existing[0]!
      } else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
          storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ||
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        })
      }
    }
    return {
      app: adminApp,
      db: getFirestore(adminApp),
      auth: getAuth(adminApp),
      storage: getAdminStorage(adminApp),
    }
  } catch (err) {
    console.error("[FirebaseAdmin] Initialization failed:", err)
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falha ao inicializar Firebase Admin em produção")
    }
    return { app: null, db: null, auth: null, storage: null }
  }
}

export async function recordUsageEvent(
  event: Omit<UsageEventRecord, "id" | "createdAt">
): Promise<UsageEventRecord> {
  const record: UsageEventRecord = {
    ...event,
    id: `usage_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    createdAt: new Date().toISOString(),
  }
  const { db } = getFirebaseAdmin()

  if (db) {
    await db.collection(FIRESTORE_COLLECTIONS.usageEvents).doc(record.id).set(record)
    return record
  }

  const store = loadLocalStore()
  store.usageEvents = [...(store.usageEvents ?? []), record].slice(-2000)
  saveLocalStore(store)
  return record
}

// =============================================================================
// User Registration, Authentication & Profile Management
// =============================================================================

export async function registerUserAccount(params: {
  email: string
  password: string
  displayName: string
  company?: string
}): Promise<{ user: UserProfile; sessionToken: string }> {
  const normalizedEmail = params.email.trim().toLowerCase()
  const { db, auth } = getFirebaseAdmin()

  if (db) {
    const existingSnap = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get()
    if (!existingSnap.empty) {
      throw new Error("E-mail já cadastrado. Faça login na sua conta.")
    }

    let uid = `usr_${crypto.randomBytes(10).toString("hex")}`
    if (auth) {
      try {
        const fbUser = await auth.createUser({
          email: normalizedEmail,
          password: params.password,
          displayName: params.displayName,
        })
        uid = fbUser.uid
      } catch {
        // Fallback to Firestore user record if Firebase Auth user creation fails
      }
    }

    const newProfile: UserProfile = {
      uid,
      email: normalizedEmail,
      displayName: params.displayName.trim(),
      company: params.company?.trim() || "Indústria 4.0",
      passwordHash: hashPassword(params.password),
      plan: "unpaid",
      hasPaidAccess: false,
      creditsBalance: 0,
      edgeTelemetryQuota: 0,
      apiKey: `sk_edge_ind40_${crypto.randomBytes(16).toString("hex")}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).set(newProfile)
    const sessionToken = createSessionToken(uid, normalizedEmail)
    return { user: sanitizeUser(newProfile), sessionToken }
  }

  // Local persistent store
  const store = loadLocalStore()
  const existing = Object.values(store.users).find((u) => u.email === normalizedEmail)
  if (existing) {
    throw new Error("E-mail já cadastrado. Faça login na sua conta.")
  }

  const uid = `usr_${crypto.randomBytes(10).toString("hex")}`
  const newProfile: UserProfile = {
    uid,
    email: normalizedEmail,
    displayName: params.displayName.trim(),
    company: params.company?.trim() || "Indústria 4.0",
    passwordHash: hashPassword(params.password),
    plan: "unpaid",
    hasPaidAccess: false,
    creditsBalance: 0,
    edgeTelemetryQuota: 0,
    apiKey: `sk_edge_ind40_${crypto.randomBytes(16).toString("hex")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  store.users[uid] = newProfile
  saveLocalStore(store)

  const sessionToken = createSessionToken(uid, normalizedEmail)
  return { user: sanitizeUser(newProfile), sessionToken }
}

export async function loginUserAccount(params: {
  email: string
  password?: string
  firebaseIdToken?: string
}): Promise<{ user: UserProfile; sessionToken: string }> {
  const { db, auth } = getFirebaseAdmin()

  if (params.firebaseIdToken && auth && db) {
    const decoded = await auth.verifyIdToken(params.firebaseIdToken)
    const email = (decoded.email || params.email).toLowerCase()
    const userDoc = await db.collection(FIRESTORE_COLLECTIONS.users).doc(decoded.uid).get()
    let profile: UserProfile
    if (!userDoc.exists) {
      profile = {
        uid: decoded.uid,
        email,
        displayName: decoded.name || email.split("@")[0]!,
        plan: "unpaid",
        hasPaidAccess: false,
        creditsBalance: 0,
        edgeTelemetryQuota: 0,
        apiKey: `sk_edge_ind40_${crypto.randomBytes(16).toString("hex")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await db.collection(FIRESTORE_COLLECTIONS.users).doc(decoded.uid).set(profile)
    } else {
      profile = userDoc.data() as UserProfile
    }
    const sessionToken = createSessionToken(profile.uid, profile.email)
    return { user: sanitizeUser(profile), sessionToken }
  }

  const normalizedEmail = params.email.trim().toLowerCase()
  const password = params.password || ""

  if (db) {
    const snap = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get()
    if (snap.empty) {
      throw new Error("Credenciais inválidas ou conta não encontrada.")
    }
    const profile = snap.docs[0]!.data() as UserProfile
    if (profile.passwordHash && !verifyPassword(password, profile.passwordHash)) {
      throw new Error("Senha incorreta.")
    }
    const sessionToken = createSessionToken(profile.uid, profile.email)
    return { user: sanitizeUser(profile), sessionToken }
  }

  const store = loadLocalStore()
  const profile = Object.values(store.users).find((u) => u.email === normalizedEmail)
  if (!profile) {
    throw new Error("Conta não encontrada. Crie sua conta primeiro.")
  }
  if (profile.passwordHash && !verifyPassword(password, profile.passwordHash)) {
    throw new Error("Senha incorreta.")
  }

  const sessionToken = createSessionToken(profile.uid, profile.email)
  return { user: sanitizeUser(profile), sessionToken }
}

export function sanitizeUser(u: UserProfile): UserProfile {
  const copy = { ...u }
  delete copy.passwordHash
  return copy
}

export type PublicUserProfile = Omit<UserProfile, "passwordHash" | "apiKey">

export function publicUser(u: UserProfile): PublicUserProfile {
  const copy = { ...u } as Partial<UserProfile>
  delete copy.passwordHash
  delete copy.apiKey
  return copy as PublicUserProfile
}

export async function getUserProfileByUid(uid: string): Promise<UserProfile | null> {
  const { db } = getFirebaseAdmin()
  if (db) {
    const snap = await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).get()
    if (!snap.exists) return null
    return sanitizeUser(snap.data() as UserProfile)
  }
  const store = loadLocalStore()
  const user = store.users[uid]
  return user ? sanitizeUser(user) : null
}

export async function getUserByApiKey(apiKey: string): Promise<UserProfile | null> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) return null

  const { db } = getFirebaseAdmin()
  if (db) {
    const snap = await db.collection(FIRESTORE_COLLECTIONS.users).where("apiKey", "==", cleanKey).limit(1).get()
    if (snap.empty) return null
    return sanitizeUser(snap.docs[0]!.data() as UserProfile)
  }

  const store = loadLocalStore()
  const found = Object.values(store.users).find((u) => u.apiKey === cleanKey)
  return found ? sanitizeUser(found) : null
}

export async function rotateEdgeToken(uid: string): Promise<string> {
  const newToken = `sk_edge_ind40_${crypto.randomBytes(16).toString("hex")}`
  const { db } = getFirebaseAdmin()
  if (db) {
    await db.collection(FIRESTORE_COLLECTIONS.users).doc(uid).update({
      apiKey: newToken,
      updatedAt: new Date().toISOString(),
    })
    return newToken
  }
  const store = loadLocalStore()
  const user = store.users[uid]
  if (!user) throw new Error("Usuário não encontrado")
  user.apiKey = newToken
  user.updatedAt = new Date().toISOString()
  saveLocalStore(store)
  return newToken
}

/**
 * Resolves the authenticated user from either:
 * 1. `Authorization: Bearer sk_edge_ind40_...` (API / Node-RED Edge token)
 * 2. `x-api-key: sk_edge_ind40_...`
 * 3. `sa_session` HTTP cookie or `Authorization: Bearer <sessionToken>`
 */
export async function authenticateRequest(request: Request): Promise<{
  authenticated: boolean
  user: UserProfile | null
  error?: string
  statusCode?: number
}> {
  const authHeader = request.headers.get("authorization") || ""
  const apiKeyHeader = request.headers.get("x-api-key") || ""
  const cookieHeader = request.headers.get("cookie") || ""

  // 1. Check API Key
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
  const candidateApiKey =
    apiKeyHeader || (bearerToken.startsWith("sk_edge_") ? bearerToken : "")

  if (candidateApiKey) {
    const user = await getUserByApiKey(candidateApiKey)
    if (!user) {
      return {
        authenticated: false,
        user: null,
        error: "Chave de API / Licença Edge inválida ou revogada.",
        statusCode: 401,
      }
    }
    return { authenticated: true, user }
  }

  // 2. Check Session Token (Bearer or Cookie)
  let sessionToken = bearerToken && !bearerToken.startsWith("sk_edge_") ? bearerToken : ""
  if (!sessionToken && cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)sa_session=([^;]+)/)
    if (match && match[1]) {
      sessionToken = decodeURIComponent(match[1])
    }
  }

  if (sessionToken) {
    const payload = verifySessionToken(sessionToken)
    if (payload) {
      const user = await getUserProfileByUid(payload.uid)
      if (user) {
        return { authenticated: true, user }
      }
    }
  }

  return {
    authenticated: false,
    user: null,
    error: "Autenticação obrigatória. Faça login ou envie sua chave de API (x-api-key).",
    statusCode: 401,
  }
}

// =============================================================================
// Strict Paid-Only Quota Consumption (Firestore Atomic Transaction)
// =============================================================================

export async function consumeQuotaTransactional(params: {
  uid?: string
  edgeToken?: string
  creditsToConsume?: number
  edgeMessagesToConsume?: number
}): Promise<{
  allowed: boolean
  profile: UserProfile | null
  reason?: string
  code?: "AUTH_REQUIRED" | "PAYMENT_REQUIRED" | "QUOTA_DEPLETED"
}> {
  const creditsDelta = params.creditsToConsume ?? 0
  const edgeDelta = params.edgeMessagesToConsume ?? 0
  const { db } = getFirebaseAdmin()

  if (db) {
    return db.runTransaction(async (tx) => {
      let userRef
      if (params.uid) {
        userRef = db.collection(FIRESTORE_COLLECTIONS.users).doc(params.uid)
      } else if (params.edgeToken) {
        const q = await tx.get(
          db.collection(FIRESTORE_COLLECTIONS.users).where("apiKey", "==", params.edgeToken).limit(1)
        )
        if (q.empty) {
          return {
            allowed: false,
            profile: null,
            reason: "Token de licença Edge inválido ou revogado.",
            code: "AUTH_REQUIRED" as const,
          }
        }
        userRef = q.docs[0]!.ref
      } else {
        return {
          allowed: false,
          profile: null,
          reason: "Autenticação necessária.",
          code: "AUTH_REQUIRED" as const,
        }
      }

      const doc = await tx.get(userRef)
      if (!doc.exists) {
        return {
          allowed: false,
          profile: null,
          reason: "Conta não encontrada.",
          code: "AUTH_REQUIRED" as const,
        }
      }

      const profile = doc.data() as UserProfile

      if (!profile.hasPaidAccess || profile.plan === "unpaid") {
        return {
          allowed: false,
          profile: sanitizeUser(profile),
          reason:
            "Acesso bloqueado: O uso da API do Agente Semântico e do nó Node-RED requer ativação de licença via pagamento (Mercado Pago PIX ou Cartão).",
          code: "PAYMENT_REQUIRED" as const,
        }
      }

      if (creditsDelta > 0 && profile.creditsBalance < creditsDelta) {
        return {
          allowed: false,
          profile: sanitizeUser(profile),
          reason: `Saldo de créditos esgotado (${profile.creditsBalance} créditos disponíveis, ${creditsDelta} necessários). Recarregue via Mercado Pago.`,
          code: "QUOTA_DEPLETED" as const,
        }
      }

      if (edgeDelta > 0 && profile.edgeTelemetryQuota < edgeDelta) {
        return {
          allowed: false,
          profile: sanitizeUser(profile),
          reason: `Quota de telemetria Node-RED esgotada (${profile.edgeTelemetryQuota} mensagens restantes). Recarregue via Mercado Pago.`,
          code: "QUOTA_DEPLETED" as const,
        }
      }

      const updated: UserProfile = {
        ...profile,
        creditsBalance: profile.creditsBalance - creditsDelta,
        edgeTelemetryQuota: profile.edgeTelemetryQuota - edgeDelta,
        updatedAt: new Date().toISOString(),
      }

      tx.update(userRef, {
        creditsBalance: FieldValue.increment(-creditsDelta),
        edgeTelemetryQuota: FieldValue.increment(-edgeDelta),
        updatedAt: updated.updatedAt,
      })

      return { allowed: true, profile: sanitizeUser(updated) }
    })
  }

  // Local persistent store atomic check
  const store = loadLocalStore()
  let profile: UserProfile | undefined

  if (params.uid) {
    profile = store.users[params.uid]
  } else if (params.edgeToken) {
    profile = Object.values(store.users).find((u) => u.apiKey === params.edgeToken)
  }

  if (!profile) {
    return {
      allowed: false,
      profile: null,
      reason: "Conta ou token de licença não encontrado.",
      code: "AUTH_REQUIRED",
    }
  }

  if (!profile.hasPaidAccess || profile.plan === "unpaid") {
    return {
      allowed: false,
      profile: sanitizeUser(profile),
      reason:
        "Acesso bloqueado: O uso da API do Agente Semântico e do nó Node-RED requer ativação de licença via pagamento (Mercado Pago PIX ou Cartão).",
      code: "PAYMENT_REQUIRED",
    }
  }

  if (creditsDelta > 0 && profile.creditsBalance < creditsDelta) {
    return {
      allowed: false,
      profile: sanitizeUser(profile),
      reason: `Saldo de créditos esgotado (${profile.creditsBalance} créditos disponíveis, ${creditsDelta} necessários). Recarregue via Mercado Pago.`,
      code: "QUOTA_DEPLETED",
    }
  }

  if (edgeDelta > 0 && profile.edgeTelemetryQuota < edgeDelta) {
    return {
      allowed: false,
      profile: sanitizeUser(profile),
      reason: `Quota de telemetria Node-RED esgotada (${profile.edgeTelemetryQuota} mensagens restantes). Recarregue via Mercado Pago.`,
      code: "QUOTA_DEPLETED",
    }
  }

  profile.creditsBalance -= creditsDelta
  profile.edgeTelemetryQuota -= edgeDelta
  profile.updatedAt = new Date().toISOString()
  store.users[profile.uid] = profile
  saveLocalStore(store)

  return { allowed: true, profile: sanitizeUser(profile) }
}

/** Refunds a reservation when downstream processing fails after charging. */
export async function refundQuotaTransactional(params: {
  uid: string
  creditsToRefund?: number
  edgeMessagesToRefund?: number
}): Promise<void> {
  const credits = Math.max(0, params.creditsToRefund ?? 0)
  const edgeMessages = Math.max(0, params.edgeMessagesToRefund ?? 0)
  if (credits === 0 && edgeMessages === 0) return

  const { db } = getFirebaseAdmin()
  if (db) {
    await db.collection(FIRESTORE_COLLECTIONS.users).doc(params.uid).update({
      creditsBalance: FieldValue.increment(credits),
      edgeTelemetryQuota: FieldValue.increment(edgeMessages),
      updatedAt: new Date().toISOString(),
    })
    return
  }

  const store = loadLocalStore()
  const profile = store.users[params.uid]
  if (!profile) return
  profile.creditsBalance += credits
  profile.edgeTelemetryQuota += edgeMessages
  profile.updatedAt = new Date().toISOString()
  store.users[params.uid] = profile
  saveLocalStore(store)
}

/**
 * Idempotent, race-condition-proof credit allocation via Firestore Transaction.
 */
export async function allocateCreditsIdempotent(
  record: PaymentTransactionRecord
): Promise<{ alreadyProcessed: boolean; profile: UserProfile }> {
  const { db } = getFirebaseAdmin()

  if (db) {
    return db.runTransaction(async (tx) => {
      const paymentRef = db.collection(FIRESTORE_COLLECTIONS.paymentTransactions).doc(record.paymentId)
      const userRef = db.collection(FIRESTORE_COLLECTIONS.users).doc(record.uid)

      const [paymentSnap, userSnap] = await Promise.all([
        tx.get(paymentRef),
        tx.get(userRef),
      ])

      if (!userSnap.exists) {
        throw new Error("Usuário associado ao pagamento não encontrado.")
      }

      let profile = userSnap.data() as UserProfile

      if (paymentSnap.exists) {
        const existingPayment = paymentSnap.data() as PaymentTransactionRecord
        if (existingPayment.status === "approved") {
          return { alreadyProcessed: true, profile: sanitizeUser(profile) }
        }
      }

      if (record.status === "approved") {
        profile = {
          ...profile,
          plan: "pay_as_you_go",
          hasPaidAccess: true,
          creditsBalance: profile.creditsBalance + record.creditsAdded,
          edgeTelemetryQuota: profile.edgeTelemetryQuota + record.edgeQuotaAdded,
          updatedAt: new Date().toISOString(),
        }
        tx.update(userRef, {
          plan: "pay_as_you_go",
          hasPaidAccess: true,
          creditsBalance: FieldValue.increment(record.creditsAdded),
          edgeTelemetryQuota: FieldValue.increment(record.edgeQuotaAdded),
          updatedAt: profile.updatedAt,
        })
      }

      tx.set(paymentRef, record, { merge: true })
      return { alreadyProcessed: false, profile: sanitizeUser(profile) }
    })
  }

  const store = loadLocalStore()
  const existing = store.payments[record.paymentId]
  const profile = store.users[record.uid]
  if (!profile) {
    throw new Error("Usuário associado ao pagamento não encontrado.")
  }

  if (existing && existing.status === "approved") {
    return { alreadyProcessed: true, profile: sanitizeUser(profile) }
  }

  if (record.status === "approved") {
    profile.plan = "pay_as_you_go"
    profile.hasPaidAccess = true
    profile.creditsBalance += record.creditsAdded
    profile.edgeTelemetryQuota += record.edgeQuotaAdded
    profile.updatedAt = new Date().toISOString()
    store.users[profile.uid] = profile
  }

  store.payments[record.paymentId] = record
  saveLocalStore(store)
  return { alreadyProcessed: false, profile: sanitizeUser(profile) }
}

export async function listPaymentTransactions(uid: string): Promise<PaymentTransactionRecord[]> {
  const { db } = getFirebaseAdmin()
  if (db) {
    const snap = await db
      .collection("payment_transactions")
      .where("uid", "==", uid)
      .limit(25)
      .get()
    return snap.docs
      .map((d) => d.data() as PaymentTransactionRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  const store = loadLocalStore()
  return Object.values(store.payments)
    .filter((p) => p.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// =============================================================================
// HITL Review Queue Operations
// =============================================================================

export async function enqueueHitlReview(
  item: Omit<HitlReviewItem, "id" | "createdAt" | "status">
): Promise<HitlReviewItem> {
  const id = `hitl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
  const record: HitlReviewItem = {
    ...item,
    id,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  const { db } = getFirebaseAdmin()
  if (db) {
    await db.collection(FIRESTORE_COLLECTIONS.hitlReviews).doc(id).set(record)
    return record
  }

  const store = loadLocalStore()
  store.hitlQueue[id] = record
  saveLocalStore(store)
  return record
}

export async function listHitlReviews(
  uid: string,
  statusFilter?: "pending" | "approved" | "rejected"
): Promise<HitlReviewItem[]> {
  const { db } = getFirebaseAdmin()
  if (db) {
    let query = db.collection(FIRESTORE_COLLECTIONS.hitlReviews).where("uid", "==", uid)
    if (statusFilter) {
      query = query.where("status", "==", statusFilter)
    }
    const snap = await query.limit(50).get()
    return snap.docs
      .map((d) => d.data() as HitlReviewItem)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const store = loadLocalStore()
  return Object.values(store.hitlQueue)
    .filter((item) => item.uid === uid && (!statusFilter || item.status === statusFilter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function resolveHitlReview(params: {
  id: string
  uid: string
  decision: "approved" | "rejected"
  finalEclassId?: string
  finalTarget?: string
  finalUnit?: string
  reviewedBy?: string
}): Promise<HitlReviewItem | null> {
  const { db } = getFirebaseAdmin()
  const now = new Date().toISOString()

  if (db) {
    const ref = db.collection(FIRESTORE_COLLECTIONS.hitlReviews).doc(params.id)
    const snap = await ref.get()
    if (!snap.exists) return null
    const existing = snap.data() as HitlReviewItem
    if (existing.uid !== params.uid) return null
    const updated: HitlReviewItem = {
      ...existing,
      status: params.decision,
      finalEclassId: params.finalEclassId ?? existing.suggestedEclassId,
      finalTarget: params.finalTarget ?? existing.suggestedTarget,
      finalUnit: params.finalUnit ?? existing.suggestedUnit,
      reviewedBy: params.reviewedBy ?? "Engenheiro Especialista (HITL)",
      reviewedAt: now,
    }
    await ref.update(updated as unknown as Record<string, unknown>)
    return updated
  }

  const store = loadLocalStore()
  const existing = store.hitlQueue[params.id]
  if (!existing || existing.uid !== params.uid) return null
  const updated: HitlReviewItem = {
    ...existing,
    status: params.decision,
    finalEclassId: params.finalEclassId ?? existing.suggestedEclassId,
    finalTarget: params.finalTarget ?? existing.suggestedTarget,
    finalUnit: params.finalUnit ?? existing.suggestedUnit,
    reviewedBy: params.reviewedBy ?? "Engenheiro Especialista (HITL)",
    reviewedAt: now,
  }
  store.hitlQueue[params.id] = updated
  saveLocalStore(store)
  return updated
}

export async function saveAssetPackage(
  record: Omit<AssetPackageRecord, "id" | "createdAt">,
  aasxBuffer?: Buffer
): Promise<AssetPackageRecord> {
  const id = `aas_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
  const createdAt = new Date().toISOString()
  let storageUrlAasx: string | undefined

  const { db, storage } = getFirebaseAdmin()

  if (storage && aasxBuffer) {
    try {
      const bucket = storage.bucket()
      const filePath = `aasx/${record.uid}/${record.assetId}_${id}.aasx`
      const file = bucket.file(filePath)
      await file.save(aasxBuffer, {
        contentType: "application/asset-administration-shell-package+xml",
        metadata: {
          assetId: record.assetId,
          globalAssetId: record.globalAssetId,
        },
      })
      storageUrlAasx = `gs://${bucket.name}/${filePath}`
    } catch (err) {
      console.warn("[FirebaseStorage] Failed to upload AASX binary:", err)
    }
  }

  const fullRecord: AssetPackageRecord = {
    ...record,
    id,
    ...(storageUrlAasx ? { storageUrlAasx } : {}),
    createdAt,
  }

  if (db) {
    await db.collection(FIRESTORE_COLLECTIONS.aasPackages).doc(id).set(fullRecord)
    return fullRecord
  }

  const store = loadLocalStore()
  store.assets[id] = fullRecord
  saveLocalStore(store)
  return fullRecord
}
