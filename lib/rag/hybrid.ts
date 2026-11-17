import { getEclassCandidates } from "@/lib/eclass-fallback"
import {
  isPineconeConfigured,
  retrieveEclassContext,
  type SemanticContextMatch,
} from "@/lib/rag/pinecone"

const RRF_K = 60

function localCatalogMatches(queryText: string): SemanticContextMatch[] {
  return getEclassCandidates(queryText).map((candidate, index) => ({
    id: candidate.eclassId,
    score: 1 / (index + 1),
    text: [candidate.target, candidate.definition, `unit: ${candidate.unit}`]
      .filter(Boolean)
      .join(" | "),
    metadata: {
      source: "eclass-local-catalog",
      irdi: candidate.eclassId,
      target: candidate.target,
      unit: candidate.unit,
    },
  }))
}

function reciprocalRankFusion(
  denseMatches: SemanticContextMatch[],
  lexicalMatches: SemanticContextMatch[],
  limit: number
): SemanticContextMatch[] {
  const merged = new Map<
    string,
    { match: SemanticContextMatch; score: number; denseRank?: number; lexicalRank?: number }
  >()

  const add = (match: SemanticContextMatch, rank: number, source: "dense" | "lexical") => {
    const current = merged.get(match.id)
    if (!current) {
      merged.set(match.id, {
        match,
        score: 1 / (RRF_K + rank),
        [source === "dense" ? "denseRank" : "lexicalRank"]: rank,
      })
      return
    }

    current.score += 1 / (RRF_K + rank)
    current.match = {
      ...current.match,
      text: current.match.text || match.text,
      metadata: { ...match.metadata, ...current.match.metadata },
    }
    current[source === "dense" ? "denseRank" : "lexicalRank"] = rank
  }

  denseMatches.forEach((match, index) => add(match, index + 1, "dense"))
  lexicalMatches.forEach((match, index) => add(match, index + 1, "lexical"))

  return [...merged.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ match, score }) => ({
      ...match,
      score,
      metadata: {
        ...match.metadata,
        retrieval: "rrf",
      },
    }))
}

export interface HybridRetrievalOptions {
  topK?: number
  namespace?: string
  metadataFilter?: Record<string, unknown>
  correctiveRetryQuery?: string
}

function configuredMetadataFilter(): Record<string, unknown> | undefined {
  const raw = process.env.PINECONE_METADATA_FILTER_JSON?.trim()
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined
  } catch {
    console.warn("[rag/filter] PINECONE_METADATA_FILTER_JSON inválido; filtro ignorado")
    return undefined
  }
}

/**
 * Fuses dense Pinecone retrieval with the checked local ECLASS catalog. The
 * local leg is intentionally small and deterministic: it protects exact
 * industrial terms and keeps the source-of-truth catalog in the loop without
 * pretending that lexical matching is semantic understanding.
 */
export async function retrieveHybridEclassContext(
  queryText: string,
  options: HybridRetrievalOptions = {}
): Promise<SemanticContextMatch[]> {
  const limit = Math.min(Math.max(options.topK ?? 20, 1), 20)
  const lexicalMatches = localCatalogMatches(queryText)
  let denseMatches: SemanticContextMatch[] = []

  if (isPineconeConfigured()) {
    const pineconeOptions = {
      topK: limit,
      namespace: options.namespace,
      metadataFilter: options.metadataFilter ?? configuredMetadataFilter(),
    }

    try {
      denseMatches = await retrieveEclassContext(queryText, pineconeOptions)
    } catch (error) {
      if (!options.correctiveRetryQuery?.trim()) throw error
      console.warn("[rag/corrective] Falha na consulta primária; tentando consulta corretiva", error)
    }

    // One bounded corrective retrieval is enough to recover from opaque PLC
    // tags whose description carries the useful semantic signal. It is never
    // recursive and therefore has a predictable latency/cost ceiling.
    if (
      options.correctiveRetryQuery?.trim() &&
      options.correctiveRetryQuery.trim() !== queryText.trim() &&
      denseMatches.length < 3
    ) {
      try {
        const correctiveMatches = await retrieveEclassContext(
          options.correctiveRetryQuery.trim(),
          pineconeOptions
        )
        denseMatches = reciprocalRankFusion(denseMatches, correctiveMatches, limit)
      } catch (error) {
        console.warn("[rag/corrective] Consulta corretiva indisponível; mantendo catálogo local", error)
      }
    }
  }

  return reciprocalRankFusion(denseMatches, lexicalMatches, limit)
}
