// =============================================================================
// TOON Orchestrator Parser - Token-Oriented Object Notation (Formato ⟨⟩)
// =============================================================================
// Parse rigoroso da string TOON retornada pelo LLM:
// ⟨MAP_START⟩⟨SRC:tag⟩⟨TGT:ECLASS:xxx⟩⟨CONF:0.95⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩
// Converte para objeto JSON estruturado compatível com AAS e Node-RED.
// =============================================================================

export interface ToonMapping {
  source: string
  target: string
  eclassId: string
  confidence: number
  action?: string
}

export interface ToonParseOutput {
  mappings: ToonMapping[]
  actions: string[]
  raw: string
  valid: boolean
  errors: string[]
}

// Aceita ⟨⟩ (Unicode) e <> (ASCII). Valor opcional para tokens como MAP_START/MAP_END
const TOKEN_REGEX = /[⟨<]([^:>⟩]+)(?::([^>⟩]*))?[⟩>]/g

/**
 * Normaliza a string: ASCII <> vira ⟨⟩ para parsing consistente.
 */
function normalizeToon(input: string): string {
  return input.replace(/</g, "⟨").replace(/>/g, "⟩")
}

function pushMapping(
  mappings: ToonMapping[],
  m: Partial<ToonMapping> & { source: string; target: string }
): void {
  const eclassId =
    m.target?.startsWith("ECLASS:") || m.target === "UNKNOWN"
      ? m.target.replace(/^ECLASS:/, "")
      : m.target
  mappings.push({
    source: m.source,
    target: m.target,
    eclassId: eclassId === "UNKNOWN" ? "0173-1#02-AAA000" : eclassId,
    confidence: m.confidence ?? 0.5,
    action: m.action,
  })
}

/**
 * Extrai todos os tokens ⟨KEY:value⟩ ou <KEY:value> de uma string TOON.
 */
function extractTokens(input: string): Array<{ key: string; value: string }> {
  const normalized = normalizeToon(input)
  const tokens: Array<{ key: string; value: string }> = []
  let match: RegExpExecArray | null
  const re = new RegExp(TOKEN_REGEX.source, "g")
  while ((match = re.exec(normalized)) !== null) {
    tokens.push({ key: match[1].trim(), value: (match[2] ?? "").trim() })
  }
  return tokens
}

/**
 * Parse rigoroso da string TOON no formato ⟨MAP_START⟩...⟨MAP_END⟩.
 * Suporta múltiplos blocos de mapeamento e tokens ACTION soltos.
 */
/** Remove blocos markdown ``` que o LLM às vezes inclui */
function stripMarkdownCodeBlocks(text: string): string {
  return text.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim()
}

export function parseToonOrchestrator(input: string): ToonParseOutput {
  const errors: string[] = []
  const mappings: ToonMapping[] = []
  const actions: string[] = []
  const trimmed = stripMarkdownCodeBlocks((input || "").trim())

  if (!trimmed) {
    return { mappings: [], actions: [], raw: input, valid: false, errors: ["String TOON vazia"] }
  }

  const tokens = extractTokens(trimmed)

  if (tokens.length === 0) {
    return {
      mappings: [],
      actions: [],
      raw: input,
      valid: false,
      errors: ["Nenhum token ⟨KEY:value⟩ encontrado na string TOON"],
    }
  }

  // Agrupar por blocos MAP_START...MAP_END
  let currentMap: Partial<ToonMapping> = {}
  let inMap = false

  for (const { key, value } of tokens) {
    if (key === "MAP_START") {
      inMap = true
      currentMap = {}
    } else if (key === "MAP_END") {
      if (inMap && currentMap.source && currentMap.target) {
        pushMapping(mappings, { ...currentMap, source: currentMap.source, target: currentMap.target })
      }
      inMap = false
      currentMap = {}
    } else if (key === "SRC") {
      currentMap.source = value
    } else if (key === "TGT") {
      currentMap.target = value
    } else if (key === "CONF") {
      const conf = parseFloat(value)
      currentMap.confidence = Number.isNaN(conf) ? 0.5 : Math.max(0, Math.min(1, conf))
    } else if (key === "ACTION") {
      actions.push(value)
    }
  }

  // Flush último mapeamento se não terminou com MAP_END
  if (inMap && currentMap.source && currentMap.target) {
    pushMapping(mappings, { ...currentMap, source: currentMap.source, target: currentMap.target })
  }

  // Fallback: tokens SRC/TGT soltos (sem MAP_START/MAP_END) - LLM pode retornar formato simplificado
  if (mappings.length === 0) {
    const looseSrc = tokens.find((t) => t.key === "SRC")?.value
    const looseTgt = tokens.find((t) => t.key === "TGT")?.value
    const looseConf = tokens.find((t) => t.key === "CONF")?.value
    if (looseSrc && looseTgt) {
      const conf = looseConf ? parseFloat(looseConf) : 0.5
      pushMapping(mappings, {
        source: looseSrc,
        target: looseTgt,
        confidence: Number.isNaN(conf) ? 0.5 : Math.max(0, Math.min(1, conf)),
      })
    }
  }

  const valid = mappings.length > 0 || actions.length > 0
  if (mappings.length === 0 && tokens.some((t) => t.key === "MAP_START")) {
    errors.push("Bloco MAP_START encontrado mas sem mapeamento completo (SRC e TGT obrigatórios)")
  }

  return {
    mappings,
    actions,
    raw: input,
    valid,
    errors,
  }
}

/** Converte o resultado do parser orchestrator para ToonParseResult (compatível com ModuleToon) */
export function toDisplayParseResult(
  parsed: ToonParseOutput
): {
  valid: boolean
  tokens: Array<{ type: "MAP" | "SRC" | "TGT" | "ACTION"; value: string; valid: boolean }>
  raw: string
  errors: string[]
  formatted: Array<{ text: string; type: "keyword" | "operator" | "string" | "identifier" | "error" | "bracket" }>
} {
  const tokens: Array<{ type: "MAP" | "SRC" | "TGT" | "ACTION"; value: string; valid: boolean }> = []
  const formatted: Array<{
    text: string
    type: "keyword" | "operator" | "string" | "identifier" | "error" | "bracket"
  }> = []

  const m = parsed.mappings[0]
  if (m) {
    tokens.push({ type: "SRC", value: m.source, valid: true })
    tokens.push({ type: "TGT", value: m.target, valid: m.target !== "UNKNOWN" })
    tokens.push({
      type: "ACTION",
      value: parsed.actions[0] ?? "DirectMap",
      valid: true,
    })
    formatted.push({ text: "⟨MAP_START⟩", type: "keyword" })
    formatted.push({ text: "⟨SRC:", type: "keyword" })
    formatted.push({ text: m.source, type: "string" })
    formatted.push({ text: "⟩", type: "bracket" })
    formatted.push({ text: "⟨TGT:", type: "keyword" })
    formatted.push({ text: m.target, type: "identifier" })
    formatted.push({ text: "⟩⟨CONF:", type: "operator" })
    formatted.push({ text: String(m.confidence), type: "string" })
    formatted.push({ text: "⟩⟨MAP_END⟩", type: "bracket" })
  } else {
    formatted.push({ text: parsed.raw, type: "identifier" })
  }

  return {
    valid: parsed.valid,
    tokens,
    raw: parsed.raw,
    errors: parsed.errors,
    formatted,
  }
}
