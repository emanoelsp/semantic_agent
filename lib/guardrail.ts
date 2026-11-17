// =============================================================================
// Guardrail Industrial, Rate Limiter & Physical Dimensional Safety Validator
// =============================================================================
// 1. Validates industrial context (PLC tags, sensors, actuators, CPS APIs).
// 2. Sanitizes against XSS, SQLi, Prompt Injection, and oversized payloads.
// 3. Enforces Dimensional & Physical Unit Safety (preventing incompatible unit
//    conversions across Pressure, Temperature, Electrical, Velocity, Flow).
// 4. Sliding-window API Rate Limiter per IP/Client.
// =============================================================================

import { findEclassEntry } from "@/lib/aas-v3"

/** Termos e padrões que indicam contexto industrial válido */
const INDUSTRIAL_PATTERNS = [
  // Tags PLC (Siemens S7, Rockwell ControlLogix, Schneider Modbus, Mitsubishi, Codesys)
  /\b(DB\d+\.(W|D|B|X|DBX|DBW|DBD)\d*(\.\d+)?|%[IQM][XWDL]?\d+(\.\d+)?|MW\d+|MD\d+|N\d+:\d+|F\d+:\d+|[IQ]\d+(\.\d+)?)\b/i,
  /\b(s7|siemens|allen.?bradley|rockwell|schneider|omron|mitsubishi|beckhoff|plc|scada|hmi|opc.?ua|modbus|profinet|ethercat|canopen)\b/i,
  // Sensores, grandezas físicas e telemetria
  /\b(sensor|temperatura|temperature|pressure|pressao|flow|vazao|velocity|velocidade|rpm|humidity|umidade|voltage|tensao|current|corrente|power|potencia|torque|vibration|vibracao)\b/i,
  /\b(telemetry|telemetria|iot|iiot|mqtt|opcua|rest.?api|edge|gateway)\b/i,
  // Ativos e equipamentos
  /\b(motor|motor_|mtr_|actuator|atuador|conveyor|esteira|pump|bomba|valve|valvula|compressor|inversor|vfd|drive|spindle|cilindro|robo)\b/i,
  /\b(temp|tmp|spd|vel|pres|flow|rpm|status|control|cmd|start|stop|run|fault|alarm|emerg|limit|photo)\b/i,
  // APIs e endpoints CPS
  /^\/[\w\-/]+$/,
  /\b(api|endpoint|topic|graphql|webhook|submodel)\b/i,
  // ECLASS, AAS e padrões semânticos
  /\b(eclass|ecds|irdi|aas|aasx|idta|idsa|rami|asset.?administration.?shell)\b/i,
  /\b(0173-\d+#\d+-[A-Z0-9]+(#\d+)?)/i,
  // Identificadores técnicos de tags
  /^[a-zA-Z0-9_.\-/:%#]+$/,
]

/** Palavras que indicam conteúdo claramente fora do escopo industrial */
const NON_INDUSTRIAL_WORDS = [
  "futebol", "futebolista", "gol", "bola", "campeonato", "torcida", "esporte",
  "receita", "culinaria", "comida", "restaurante", "filme", "musica", "cinema",
  "politica", "eleicao", "fofoca", "horoscopo", "novela", "celebridade",
]

/** Padrões que indicam conteúdo malicioso, XSS, SQLi ou Prompt Injection */
const BLOCKED_PATTERNS = [
  /<script|javascript:|on\w+\s*=/i,
  /\b(select|insert|update|delete|drop|exec|execute|union)\s+.*\b(from|into|table|database)\b/i,
  /\b(eval|document\.write|window\.location)\s*\(/i,
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*prompt|you\s+are\s+now\s+a|forget\s+your\s+rules/i,
  /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/,
  /[\s\S]{6000,}/,
]

export interface GuardrailResult {
  valid: boolean
  reason?: string
  sanitizedText?: string
}

export function sanitizeIndustrialInput(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 4000)
}

/**
 * Analisa o payload de entrada e determina se está no escopo industrial.
 */
export function validateIndustrialContext(payload: unknown): GuardrailResult {
  if (payload === null || payload === undefined) {
    return { valid: false, reason: "Payload vazio" }
  }

  let textToAnalyze: string

  if (typeof payload === "string") {
    textToAnalyze = payload.trim()
  } else if (typeof payload === "object" && "inputData" in (payload as object)) {
    const obj = payload as { inputData?: string; description?: string }
    textToAnalyze = `${obj.inputData ?? ""} ${obj.description ?? ""}`.trim()
  } else if (typeof payload === "object" && "text" in (payload as object)) {
    const obj = payload as { text?: string }
    textToAnalyze = String(obj.text ?? "").trim()
  } else {
    textToAnalyze = JSON.stringify(payload)
  }

  if (!textToAnalyze || textToAnalyze.length < 1) {
    return { valid: false, reason: "Input vazio" }
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(textToAnalyze)) {
      return {
        valid: false,
        reason: "Violação de Guardrail de Segurança: padrão bloqueado (XSS/Injection/Overflow)",
      }
    }
  }

  const lower = textToAnalyze.toLowerCase()
  const isBlockedWord = NON_INDUSTRIAL_WORDS.some(
    (w) =>
      lower === w ||
      lower.includes(` ${w} `) ||
      lower.startsWith(`${w} `) ||
      lower.endsWith(` ${w}`)
  )
  if (isBlockedWord) {
    return {
      valid: false,
      reason: "Input rejeitado: fora do domínio de automação industrial (PLC, Sensores, AAS, ECLASS)",
    }
  }

  const hasIndustrialMatch = INDUSTRIAL_PATTERNS.some((p) => p.test(textToAnalyze))
  if (!hasIndustrialMatch) {
    const looksLikeTag =
      textToAnalyze.length <= 96 &&
      /^[\w.\-_/:#%]+$/.test(textToAnalyze) &&
      (/\d/.test(textToAnalyze) || /[A-Z_.]/.test(textToAnalyze))
    if (looksLikeTag) {
      return { valid: true, sanitizedText: sanitizeIndustrialInput(textToAnalyze) }
    }
    return {
      valid: false,
      reason: "Input fora do escopo industrial (sensores, PLCs, telemetria, AAS, ECLASS)",
    }
  }

  return { valid: true, sanitizedText: sanitizeIndustrialInput(textToAnalyze) }
}

// =============================================================================
// Physical Dimensional & Unit Safety Guardrail
// =============================================================================
// Prevents hallucinatory or unsafe industrial mappings (e.g. mapping a
// temperature tag in Celsius to a Pressure ECLASS IRDI in bar, or applying
// an invalid unit conversion formula).

const DOMAIN_UNITS: Record<string, string[]> = {
  temperature: ["degc", "c", "°c", "f", "°f", "fahrenheit", "k", "kelvin", "celsius"],
  pressure: ["bar", "mbar", "pa", "kpa", "mpa", "psi", "atm"],
  velocity: ["m/s", "mm/s", "km/h", "ft/s", "rpm", "1/min", "hz"],
  electrical: ["v", "mv", "kv", "a", "ma", "w", "kw", "mw", "ohm", "hz"],
  flow: ["m³/h", "m3/h", "l/min", "l/s", "gpm", "kg/h"],
  status: ["boolean", "bool", "bit", "unitless", "1", "0"],
  actuator: ["boolean", "bool", "bit", "unitless", "%", "rpm"],
  sensor: ["boolean", "bool", "bit", "unitless", "mm", "cm", "m"],
}

export interface PhysicalSafetyCheckResult {
  safe: boolean
  adjustedUnit: string
  warning?: string
  confidencePenalty: number
}

export function validatePhysicalDimensionalSafety(params: {
  sourceTag: string
  description?: string
  dataType?: string
  eclassIrdi: string
  proposedUnit?: string
  action?: string
  actionDetail?: string
}): PhysicalSafetyCheckResult {
  const entry = findEclassEntry(params.eclassIrdi)
  if (!entry) {
    return {
      safe: true,
      adjustedUnit: params.proposedUnit || "unitless",
      confidencePenalty: 0.1,
      warning: "IRDI não encontrado no dicionário estrito local; requer verificação HITL.",
    }
  }

  const combinedText = `${params.sourceTag} ${params.description ?? ""}`.toLowerCase()
  const proposedUnitLower = (params.proposedUnit || entry.unit).toLowerCase()
  const allowedUnits = DOMAIN_UNITS[entry.domain] ?? []

  // 1. Check datatype incompatibility (e.g., BOOL PLC tag mapped to REAL_MEASURE Temperature/Pressure)
  if (
    params.dataType?.toUpperCase() === "BOOL" &&
    entry.iecDataType === "REAL_MEASURE" &&
    ["temperature", "pressure", "electrical", "flow"].includes(entry.domain)
  ) {
    return {
      safe: false,
      adjustedUnit: entry.unit,
      confidencePenalty: 0.35,
      warning: `Incompatibilidade Dimensional: Variável booleana (${params.dataType}) mapeada para grandeza contínua (${entry.preferredNamePt} em ${entry.unit}). Encaminhado para HITL.`,
    }
  }

  // 2. Check cross-domain hallucination (e.g., description clearly says "pressão/bar/psi" but mapped to Temperature)
  if (
    entry.domain === "temperature" &&
    /\b(pressao|pressure|psi|bar|mpa|corrente|ampere|voltage|tensao)\b/i.test(combinedText)
  ) {
    return {
      safe: false,
      adjustedUnit: entry.unit,
      confidencePenalty: 0.4,
      warning: `Conflito Físico Detectado: Contexto indica Pressão/Elétrica, mas o IRDI aponta para Temperatura (${entry.irdi}).`,
    }
  }

  if (
    entry.domain === "pressure" &&
    /\b(temperatura|temperature|celsius|fahrenheit|kelvin|pt100|termopar)\b/i.test(combinedText)
  ) {
    return {
      safe: false,
      adjustedUnit: entry.unit,
      confidencePenalty: 0.4,
      warning: `Conflito Físico Detectado: Contexto indica Temperatura, mas o IRDI aponta para Pressão (${entry.irdi}).`,
    }
  }

  // 3. Check unit compatibility
  if (
    proposedUnitLower &&
    proposedUnitLower !== "unknown" &&
    allowedUnits.length > 0 &&
    !allowedUnits.includes(proposedUnitLower)
  ) {
    return {
      safe: false,
      adjustedUnit: entry.unit,
      confidencePenalty: 0.25,
      warning: `Unidade '${params.proposedUnit}' incompatível com o domínio '${entry.domain}'. Ajustada automaticamente para a unidade canônica ECLASS '${entry.unit}'.`,
    }
  }

  return {
    safe: true,
    adjustedUnit: entry.unit,
    confidencePenalty: 0,
  }
}

// =============================================================================
// Sliding-Window API Rate Limiter
// =============================================================================

interface RateLimitBucket {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitBucket>()

export function checkRateLimit(
  clientKey: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now()
  const bucket = rateLimitStore.get(clientKey) ?? { timestamps: [] }

  // Prune expired timestamps
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] ?? now
    const resetInSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    rateLimitStore.set(clientKey, bucket)
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  bucket.timestamps.push(now)
  rateLimitStore.set(clientKey, bucket)

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - bucket.timestamps.length),
    resetInSeconds: Math.ceil(windowMs / 1000),
  }
}
