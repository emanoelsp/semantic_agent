// =============================================================================
// ECLASS Fallback - Inferência heurística quando LLM retorna UNKNOWN
// =============================================================================
// Códigos IRDI ECLASS comuns (IEC CDD). Usado para forçar modelagem AAS
// quando o LLM não consegue mapear com confiança.
// =============================================================================

export interface EclassFallbackResult {
  eclassId: string
  target: string
  unit: string
  confidence: number
}

/** Padrões de tag → ECLASS (regex case-insensitive, ordem de prioridade) */
const ECLASS_PATTERNS: Array<{
  pattern: RegExp
  eclassId: string
  target: string
  unit: string
}> = [
  // Temperatura
  {
    pattern: /\b(temp|tmp|temperatura|_tmp_|mtr_tmp)\b/i,
    eclassId: "0173-1#02-AAB713#005",
    target: "Temperature",
    unit: "degC",
  },
  // Velocidade
  {
    pattern: /\b(vel|spd|speed|velocity|rpm|vazao|flow)\b/i,
    eclassId: "0173-1#02-BAA123",
    target: "Velocity (linear)",
    unit: "m/s",
  },
  // Status operacional (boolean)
  {
    pattern: /\b(status|start|stop|run|cmd|control|enable|operating)\b/i,
    eclassId: "0173-1#02-BAF321#004",
    target: "Operating Status",
    unit: "boolean",
  },
  // Pressão
  {
    pattern: /\b(pres|pressure|pressao)\b/i,
    eclassId: "0173-1#02-AAA699",
    target: "Pressure",
    unit: "bar",
  },
  // Motor
  {
    pattern: /\b(mtr|motor|mtr_)\b/i,
    eclassId: "0173-1#02-BAA123",
    target: "Motor related property",
    unit: "unknown",
  },
  // Sensor genérico
  {
    pattern: /\b(sen|sensor)\b/i,
    eclassId: "0173-1#02-AAB713#005",
    target: "Sensor value",
    unit: "unknown",
  },
]

/** ECLASS genérico para fallback final */
const GENERIC_ECLASS = {
  eclassId: "0173-1#02-AAA000",
  target: "Generic Sensor Value",
  unit: "unknown",
  confidence: 0.6,
}

/**
 * Infere ECLASS a partir do nome da tag quando o LLM retorna UNKNOWN.
 * Usado para forçar modelagem AAS conforme variáveis mapeadas.
 */
export function inferEclassFromTag(tagName: string): EclassFallbackResult {
  const normalized = tagName.trim()
  for (const { pattern, eclassId, target, unit } of ECLASS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        eclassId,
        target,
        unit,
        confidence: 0.75,
      }
    }
  }
  return {
    ...GENERIC_ECLASS,
    confidence: 0.6,
  }
}

/**
 * Aplica fallback ECLASS quando o mapeamento do LLM é UNKNOWN ou genérico.
 */
export function applyEclassFallback(
  source: string,
  llmEclassId: string,
  llmTarget: string,
  llmConfidence: number
): EclassFallbackResult & { applied: boolean } {
  const isUnknown =
    llmEclassId === "UNKNOWN" ||
    llmEclassId === "0173-1#02-AAA000" ||
    llmTarget === "UNKNOWN"

  const shouldApply = isUnknown || llmConfidence < 0.5

  if (!shouldApply) {
    return {
      eclassId: llmEclassId,
      target: llmTarget,
      unit: inferUnit(llmTarget),
      confidence: llmConfidence,
      applied: false,
    }
  }

  const fallback = inferEclassFromTag(source)
  return {
    ...fallback,
    applied: true,
  }
}

function inferUnit(target: string): string {
  if (/temp|temperature|temperatura/i.test(target)) return "degC"
  if (/velocity|velocidade|speed|rpm/i.test(target)) return "m/s"
  if (/pressure|pressao/i.test(target)) return "bar"
  if (/flow|vazao/i.test(target)) return "m³/h"
  if (/status|start|stop|boolean/i.test(target)) return "boolean"
  return "unknown"
}
