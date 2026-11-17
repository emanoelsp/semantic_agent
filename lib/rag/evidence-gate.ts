import { normalizeIrdi } from "@/lib/aas-v3"
import type { SemanticContextMatch } from "@/lib/rag/pinecone"

export interface EvidenceGateResult {
  grounded: boolean
  requireHumanReview: boolean
  confidencePenalty: number
  matchedEvidenceId?: string
  reason?: string
}

function candidateId(candidate: SemanticContextMatch): string {
  const metadataId = candidate.metadata.irdi || candidate.metadata.eclassId
  return String(metadataId || candidate.id)
}

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

/**
 * A model confidence score is not evidence by itself. This gate requires the
 * proposed IRDI to be present in retrieved, catalog-backed context and lowers
 * confidence when the retrieval layer cannot support the decision.
 */
export function assessEvidence(params: {
  eclassIrdi: string
  candidates: SemanticContextMatch[]
}): EvidenceGateResult {
  const proposed = normalizeIrdi(params.eclassIrdi)
  const matched = params.candidates.find((candidate) => {
    try {
      return normalizeIrdi(candidateId(candidate)) === proposed
    } catch {
      return false
    }
  })

  if (!matched) {
    return {
      grounded: false,
      requireHumanReview: true,
      confidencePenalty: envNumber("EVIDENCE_MISSING_PENALTY", 0.25),
      reason:
        params.candidates.length === 0
          ? "Nenhuma evidência recuperada para sustentar o IRDI proposto."
          : "O IRDI proposto não apareceu entre as evidências recuperadas.",
    }
  }

  const minRerankScore = envNumber("EVIDENCE_MIN_RERANK_SCORE", 0)
  if (
    typeof matched.rerankScore === "number" &&
    matched.rerankScore < minRerankScore
  ) {
    return {
      grounded: false,
      requireHumanReview: true,
      confidencePenalty: envNumber("EVIDENCE_LOW_RERANK_PENALTY", 0.15),
      matchedEvidenceId: candidateId(matched),
      reason: `Evidência abaixo do limiar de reranking (${matched.rerankScore.toFixed(3)} < ${minRerankScore.toFixed(3)}).`,
    }
  }

  return {
    grounded: true,
    requireHumanReview: false,
    confidencePenalty: 0,
    matchedEvidenceId: candidateId(matched),
  }
}
