// =============================================================================
// ECLASS Semantic Candidate Retrieval & Fallback Engine (ECLASS 14.0 / IEC CDD)
// =============================================================================
// Provides lexical & semantic candidate retrieval over the ECLASS 14.0
// dictionary and calibrated fallback scoring (< 0.85 triggers HITL review).
// =============================================================================

import { ECLASS_DICTIONARY, findEclassEntry, normalizeIrdi } from "./aas-v3.ts"

export interface EclassFallbackResult {
  eclassId: string
  target: string
  unit: string
  confidence: number
}

const ECLASS_PATTERNS: Array<{
  pattern: RegExp
  eclassId: string
  target: string
  unit: string
  baseConfidence: number
}> = [
  // Temperatura
  {
    pattern: /\b(temp|tmp|temperatura|temperature|_tmp_|mtr_tmp|pt100|termopar|bearing.*temp)\b/i,
    eclassId: "0173-1#02-AAB713#005",
    target: "Temperature",
    unit: "degC",
    baseConfidence: 0.82,
  },
  // Velocidade Linear
  {
    pattern: /\b(vel|spd|speed|velocity|velocidade|esteira|conveyor.*speed)\b/i,
    eclassId: "0173-1#02-BAA123#003",
    target: "Linear Velocity",
    unit: "m/s",
    baseConfidence: 0.81,
  },
  // Rotação RPM
  {
    pattern: /\b(rpm|rotacao|rotational|spindle|giro)\b/i,
    eclassId: "0173-1#02-AAO663#003",
    target: "Rotational Speed",
    unit: "1/min",
    baseConfidence: 0.83,
  },
  // Comando de acionamento / Motor Forward
  {
    pattern: /\b(acionar|marcha|comando.*motor|motor.*forward|start|ligar|drive.*cmd|q\d+)\b/i,
    eclassId: "0173-1#02-BAB014#005",
    target: "Drive Actuation Command (Motor Forward)",
    unit: "boolean",
    baseConfidence: 0.82,
  },
  // Status operacional (boolean)
  {
    pattern: /\b(status|stop|run|cmd|control|enable|operating|estado)\b/i,
    eclassId: "0173-1#02-BAF321#004",
    target: "Operating Status",
    unit: "boolean",
    baseConfidence: 0.80,
  },
  // Pressão
  {
    pattern: /\b(pres|pressure|pressao|bar|psi|pneumat|hidraul)\b/i,
    eclassId: "0173-1#02-AAA699#004",
    target: "Operating Pressure",
    unit: "bar",
    baseConfidence: 0.83,
  },
  // Tensão Elétrica
  {
    pattern: /\b(volt|voltage|tensao|u_nom|vdc|vac)\b/i,
    eclassId: "0173-1#02-AAO676#002",
    target: "Rated Voltage",
    unit: "V",
    baseConfidence: 0.83,
  },
  // Corrente Elétrica
  {
    pattern: /\b(curr|current|corrente|amp|ampere|i_op)\b/i,
    eclassId: "0173-1#02-AAO677#002",
    target: "Operating Current",
    unit: "A",
    baseConfidence: 0.83,
  },
  // Potência Ativa
  {
    pattern: /\b(power|potencia|kw|watt)\b/i,
    eclassId: "0173-1#02-AAO680#002",
    target: "Active Power",
    unit: "kW",
    baseConfidence: 0.82,
  },
  // Vazão Volumétrica
  {
    pattern: /\b(flow|vaz(?:ão|ao)|caudal)\b/i,
    eclassId: "0173-1#02-AAO732#003",
    target: "Volumetric Flow Rate",
    unit: "m³/h",
    baseConfidence: 0.82,
  },
  // Barreira óptica / sensor fotoelétrico
  {
    pattern: /\b(photo|fototransistor|fotoeletrico|barreira|light.*barrier)\b/i,
    eclassId: "0173-1#02-BAA014#002",
    target: "Photoelectric Barrier State",
    unit: "boolean",
    baseConfidence: 0.84,
  },
  // Fim de curso / Limit switch
  {
    pattern: /\b(limit|fim.*curso|switch|endstop|i\d+)\b/i,
    eclassId: "0173-1#02-BAA283#002",
    target: "Limit Switch Position State",
    unit: "boolean",
    baseConfidence: 0.78,
  },
]

const GENERIC_ECLASS = {
  eclassId: "0173-1#02-BAF321#004",
  target: "Operating Status (Unverified Tag)",
  unit: "boolean",
  confidence: 0.58,
}

/**
 * Returns ranked ECLASS candidates for HITL review when confidence < 0.85.
 */
export function getEclassCandidates(
  tagName: string,
  description?: string
): Array<{ eclassId: string; target: string; unit: string; definition?: string }> {
  const combined = `${tagName} ${description ?? ""}`.trim()
  const candidates: Array<{ eclassId: string; target: string; unit: string; definition?: string }> = []
  const seen = new Set<string>()

  for (const { pattern, eclassId, target, unit } of ECLASS_PATTERNS) {
    if (pattern.test(combined) && !seen.has(eclassId)) {
      seen.add(eclassId)
      const dict = findEclassEntry(eclassId)
      candidates.push({
        eclassId,
        target: dict?.preferredNamePt ? `${dict.preferredNameEn} (${dict.preferredNamePt})` : target,
        unit,
        definition: dict?.definitionEn,
      })
    }
  }

  // Always include top industrial ECLASS dictionary options for human reviewer selection
  for (const entry of ECLASS_DICTIONARY) {
    if (candidates.length >= 6) break
    if (!seen.has(entry.irdi)) {
      seen.add(entry.irdi)
      candidates.push({
        eclassId: entry.irdi,
        target: `${entry.preferredNameEn} (${entry.preferredNamePt})`,
        unit: entry.unit,
        definition: entry.definitionEn,
      })
    }
  }

  return candidates
}

export function inferEclassFromTag(tagName: string, description?: string): EclassFallbackResult {
  const combined = `${tagName} ${description ?? ""}`.trim()
  for (const { pattern, eclassId, target, unit, baseConfidence } of ECLASS_PATTERNS) {
    if (pattern.test(combined)) {
      // If description was provided, boost confidence slightly, otherwise keep < 0.85 to trigger HITL
      const hasDesc = Boolean(description && description.trim().length > 4)
      return {
        eclassId,
        target,
        unit,
        confidence: hasDesc ? Math.min(0.88, baseConfidence + 0.06) : Math.min(0.78, baseConfidence - 0.05),
      }
    }
  }
  return {
    ...GENERIC_ECLASS,
  }
}

export function applyEclassFallback(
  source: string,
  llmEclassId: string,
  llmTarget: string,
  llmConfidence: number,
  description?: string
): EclassFallbackResult & { applied: boolean; uncertaintyReasons: string[] } {
  const reasons: string[] = []
  const normalizedIrdi = normalizeIrdi(llmEclassId)
  const dictEntry = findEclassEntry(normalizedIrdi)

  const isUnknown =
    llmEclassId === "UNKNOWN" ||
    llmEclassId === "0173-1#02-AAA000" ||
    llmTarget === "UNKNOWN"

  if (isUnknown) {
    reasons.push("Modelo LLM retornou UNKNOWN por ausência de contexto semântico explícito.")
  }

  if (!description || description.trim().length < 3) {
    reasons.push("Variável isolada sem descrição funcional (tag criptográfica de CLP).")
  }

  if (!dictEntry && !isUnknown) {
    reasons.push(`IRDI ${normalizedIrdi} requer validação contra o catálogo mestre ECLASS 14.0.`)
  }

  const shouldApply = isUnknown || llmConfidence < 0.55

  if (!shouldApply) {
    // Calibrate confidence: if no description was provided for a raw PLC address (like DB10.W2), cap confidence at 0.82 so HITL is triggered
    const isRawPlcAddress = /^(DB\d+|%[IQM]|MW\d+|MD\d+|I\d+|Q\d+)/i.test(source.trim())
    const calibratedConf =
      isRawPlcAddress && (!description || description.trim().length === 0)
        ? Math.min(llmConfidence, 0.82)
        : llmConfidence

    if (calibratedConf < 0.85 && reasons.length === 0) {
      reasons.push("Confiança abaixo do limiar de segurança industrial (85%) para mapeamento autônomo.")
    }

    return {
      eclassId: dictEntry ? dictEntry.irdi : normalizedIrdi,
      target: dictEntry ? dictEntry.preferredNameEn : llmTarget,
      unit: dictEntry ? dictEntry.unit : inferUnit(llmTarget),
      confidence: calibratedConf,
      applied: false,
      uncertaintyReasons: reasons,
    }
  }

  const fallback = inferEclassFromTag(source, description)
  reasons.push(`Inferência heurística aplicada (${fallback.eclassId} - ${fallback.target}). Requer aprovação HITL.`)

  return {
    ...fallback,
    applied: true,
    uncertaintyReasons: reasons,
  }
}

function inferUnit(target: string): string {
  if (/temp|temperature|temperatura/i.test(target)) return "degC"
  if (/rpm|rotat/i.test(target)) return "1/min"
  if (/velocity|velocidade|speed/i.test(target)) return "m/s"
  if (/pressure|pressao/i.test(target)) return "bar"
  if (/voltage|tensao/i.test(target)) return "V"
  if (/current|corrente/i.test(target)) return "A"
  if (/power|potencia/i.test(target)) return "kW"
  if (/flow|vazao/i.test(target)) return "m³/h"
  if (/status|start|stop|boolean|switch|barrier/i.test(target)) return "boolean"
  return "unitless"
}
