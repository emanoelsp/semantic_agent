// =============================================================================
// Guardrail - Filtro de Domínio Industrial
// =============================================================================
// Valida se o payload de entrada está relacionado ao contexto industrial:
// sensores, motores, PLCs, telemetria, tags, APIs de CPS.
// Rejeita inputs maliciosos ou fora do escopo semântico.
// =============================================================================

/** Termos e padrões que indicam contexto industrial válido */
const INDUSTRIAL_PATTERNS = [
  // Tags PLC e linguagens industriais
  /\b(DB\d+\.(W|D|B|X|DBX|DBW|DBD)|%[IQM]\w+|MW\d+|MD\d+|DB\d+\.DB[WXD]\d+)\b/i,
  /\b(s7|siemens|allen.?bradley|rockwell|plc|scada|hmi|opc.?ua|modbus|profinet|ethercat)\b/i,
  // Sensores e telemetria
  /\b(sensor|temperatura|temperatur|pressure|pressao|flow|vazao|velocity|velocidade|rpm|humidity|umidade)\b/i,
  /\b(telemetry|telemetria|iot|mqtt|opcua|rest.?api)\b/i,
  // Ativos e equipamentos
  /\b(motor|motor_|mtr_|actuator|actuador|conveyor|esteira|pump|bomba|valve|valvula)\b/i,
  /\b(temp|tmp|spd|vel|pres|flow|rpm|status|control|cmd)\b/i,
  // APIs e endpoints CPS
  /^\/[\w\-/]+$/,
  /\b(api|endpoint|topic|graphql|webhook)\b/i,
  // ECLASS e padrões semânticos
  /\b(eclass|ecds|irdi|aas|asset.?administration.?shell)\b/i,
  /\b(0173-\d+#\d+-\w+)/i,
  // Identificadores genéricos de tags
  /^[\w.\-_/]+$/,
]

/** Palavras que indicam conteúdo claramente fora do escopo industrial */
const NON_INDUSTRIAL_WORDS = [
  "futebol", "futebolista", "gol", "bola", "campo", "time", "jogo", "partida",
  "futebolista", "torcida", "campeonato", "copa", "liga", "esporte", "esportivo",
  "receita", "culinaria", "comida", "restaurante", "filme", "musica", "cinema",
  "politica", "eleicao", "noticia", "entretenimento", "viagem", "turismo",
]

/** Padrões que indicam conteúdo malicioso ou fora de escopo */
const BLOCKED_PATTERNS = [
  /<script|javascript:|on\w+\s*=/i,
  /\b(select|insert|update|delete|drop|exec|execute)\s+.*\b(from|into|table)\b/i,
  /\b(prompt|eval|document\.write)\s*\(/i,
  /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/,
  /[\s\S]{2000,}/, // Payload excessivamente longo
]

export interface GuardrailResult {
  valid: boolean
  reason?: string
}

/**
 * Analisa o payload de entrada e determina se está no escopo industrial.
 * Usa heurísticas baseadas em regex para validação rápida e barata.
 */
export function validateIndustrialContext(payload: unknown): GuardrailResult {
  if (payload === null || payload === undefined) {
    return { valid: false, reason: "Payload vazio" }
  }

  let textToAnalyze: string

  if (typeof payload === "string") {
    textToAnalyze = payload.trim()
  } else if (typeof payload === "object" && "inputData" in (payload as object)) {
    const obj = payload as { inputData?: string }
    textToAnalyze = String(obj.inputData ?? "").trim()
  } else if (typeof payload === "object" && "text" in (payload as object)) {
    const obj = payload as { text?: string }
    textToAnalyze = String(obj.text ?? "").trim()
  } else {
    textToAnalyze = JSON.stringify(payload)
  }

  if (!textToAnalyze || textToAnalyze.length < 1) {
    return { valid: false, reason: "Input vazio" }
  }

  // Verificar padrões bloqueados (segurança)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(textToAnalyze)) {
      return { valid: false, reason: "Conteúdo não permitido" }
    }
  }

  // Verificar se há pelo menos um padrão industrial
  const hasIndustrialMatch = INDUSTRIAL_PATTERNS.some((p) => p.test(textToAnalyze))

  if (!hasIndustrialMatch) {
    // Bloquear palavras claramente fora do escopo
    const lower = textToAnalyze.toLowerCase()
    const isBlocked = NON_INDUSTRIAL_WORDS.some(
      (w) => lower === w || lower.includes(` ${w} `) || lower.startsWith(`${w} `) || lower.endsWith(` ${w}`)
    )
    if (isBlocked) {
      return {
        valid: false,
        reason: "Input fora do escopo industrial (sensores, PLCs, telemetria, AAS, ECLASS)",
      }
    }
    // Fallback: strings curtas que parecem tags técnicas (ex: DB10.W2, Mtr_Tmp)
    const looksLikeTag =
      textToAnalyze.length <= 80 &&
      /^[\w.\-_/:#]+$/.test(textToAnalyze) &&
      (/\d/.test(textToAnalyze) || /[A-Z_\.]/.test(textToAnalyze) || /^(db|mw|md|%|api\/)/i.test(textToAnalyze))
    if (looksLikeTag) {
      return { valid: true }
    }
    return {
      valid: false,
      reason: "Input fora do escopo industrial (sensores, PLCs, telemetria, AAS, ECLASS)",
    }
  }

  return { valid: true }
}
