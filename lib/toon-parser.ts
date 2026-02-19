// =============================================================================
// TOON Parser - Validador de Gramatica BNF
// =============================================================================
// Este parser implementa a validacao da notacao TOON conforme a gramatica:
//
// <TOON>    ::= MAP{ <SOURCE> | <TARGET> | <ACTION> }
// <SOURCE>  ::= SRC='<identificador_original>'
// <TARGET>  ::= TGT='<eclass_irdi_ou_id_semantico>'
// <ACTION>  ::= ACTION='<DirectMap | Convert_Unit | Aggregate>'
// =============================================================================

export interface ToonToken {
  type: "MAP" | "SRC" | "TGT" | "ACTION"
  value: string
  valid: boolean
  error?: string
}

export interface ToonParseResult {
  valid: boolean
  tokens: ToonToken[]
  raw: string
  errors: string[]
  formatted: ToonFormattedSegment[]
}

export interface ToonFormattedSegment {
  text: string
  type: "keyword" | "operator" | "string" | "identifier" | "error" | "bracket"
}

const VALID_ACTIONS = ["DirectMap", "Convert_Unit", "Aggregate"]

export function parseToon(input: string): ToonParseResult {
  const errors: string[] = []
  const tokens: ToonToken[] = []
  const formatted: ToonFormattedSegment[] = []

  const trimmed = input.trim()

  // Validar estrutura MAP{ ... }
  if (!trimmed.startsWith("MAP{")) {
    errors.push("Token deve comecar com 'MAP{'")
    return { valid: false, tokens, raw: input, errors, formatted: [{ text: input, type: "error" }] }
  }

  if (!trimmed.endsWith("}")) {
    errors.push("Token deve terminar com '}'")
    return { valid: false, tokens, raw: input, errors, formatted: [{ text: input, type: "error" }] }
  }

  // Extrair conteudo interno
  const inner = trimmed.slice(4, -1).trim()
  const parts = inner.split("|").map((p) => p.trim())

  if (parts.length !== 3) {
    errors.push(`Esperados 3 campos (SRC, TGT, ACTION), encontrados ${parts.length}`)
    return { valid: false, tokens, raw: input, errors, formatted: [{ text: input, type: "error" }] }
  }

  // Parse SRC
  const srcMatch = parts[0].match(/^SRC='([^']*)'$/)
  if (srcMatch) {
    tokens.push({ type: "SRC", value: srcMatch[1], valid: true })
  } else {
    errors.push(`Campo SRC invalido: '${parts[0]}'. Formato esperado: SRC='<valor>'`)
    tokens.push({ type: "SRC", value: parts[0], valid: false, error: "Formato invalido" })
  }

  // Parse TGT
  const tgtMatch = parts[1].match(/^TGT='([^']*)'$/)
  if (tgtMatch) {
    tokens.push({ type: "TGT", value: tgtMatch[1], valid: true })
  } else {
    errors.push(`Campo TGT invalido: '${parts[1]}'. Formato esperado: TGT='<valor>'`)
    tokens.push({ type: "TGT", value: parts[1], valid: false, error: "Formato invalido" })
  }

  // Parse ACTION
  const actionMatch = parts[2].match(/^ACTION='([^']*)'$/)
  if (actionMatch) {
    const actionValue = actionMatch[1]
    const baseAction = actionValue.split("(")[0]
    if (VALID_ACTIONS.includes(baseAction)) {
      tokens.push({ type: "ACTION", value: actionValue, valid: true })
    } else {
      errors.push(`ACTION '${baseAction}' desconhecida. Permitidas: ${VALID_ACTIONS.join(", ")}`)
      tokens.push({ type: "ACTION", value: actionValue, valid: false, error: "Action desconhecida" })
    }
  } else {
    errors.push(`Campo ACTION invalido: '${parts[2]}'. Formato esperado: ACTION='<valor>'`)
    tokens.push({ type: "ACTION", value: parts[2], valid: false, error: "Formato invalido" })
  }

  // Gerar formatted segments para syntax highlighting
  formatted.push({ text: "MAP", type: "keyword" })
  formatted.push({ text: "{", type: "bracket" })
  formatted.push({ text: "SRC", type: "keyword" })
  formatted.push({ text: "=", type: "operator" })
  formatted.push({ text: `'${tokens[0]?.value || ""}'`, type: tokens[0]?.valid ? "string" : "error" })
  formatted.push({ text: " | ", type: "operator" })
  formatted.push({ text: "TGT", type: "keyword" })
  formatted.push({ text: "=", type: "operator" })
  formatted.push({ text: `'${tokens[1]?.value || ""}'`, type: tokens[1]?.valid ? "identifier" : "error" })
  formatted.push({ text: " | ", type: "operator" })
  formatted.push({ text: "ACTION", type: "keyword" })
  formatted.push({ text: "=", type: "operator" })
  formatted.push({ text: `'${tokens[2]?.value || ""}'`, type: tokens[2]?.valid ? "string" : "error" })
  formatted.push({ text: "}", type: "bracket" })

  return {
    valid: errors.length === 0,
    tokens,
    raw: input,
    errors,
    formatted,
  }
}
