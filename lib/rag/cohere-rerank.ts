import type { SemanticContextMatch } from "@/lib/rag/pinecone"

export interface RerankResult {
  matches: SemanticContextMatch[]
  billedSearchUnits: number
}

interface CohereResponse {
  results?: Array<{
    index?: number
    relevance_score?: number
  }>
  meta?: {
    billed_units?: {
      search_units?: number
    }
  }
}

function envNumber(name: string, fallback: number, min = 0): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= min ? value : fallback
}

function getRerankUrl(): string {
  return (process.env.COHERE_RERANK_URL || "https://api.cohere.com/v2/rerank").replace(/\/$/, "")
}

export function isCohereRerankConfigured(): boolean {
  return Boolean(process.env.COHERE_API_KEY?.trim())
}

function formatDocument(match: SemanticContextMatch): string {
  const metadata = Object.entries(match.metadata)
    .filter(([key, value]) => key !== "text" && typeof value !== "object")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n")

  return [`id: ${match.id}`, metadata, `content: ${match.text}`].filter(Boolean).join("\n")
}

/**
 * Reranks already retrieved candidates. Cohere is never the source of truth:
 * it only changes order and score of Pinecone candidates.
 */
export async function rerankEclassContext(
  query: string,
  candidates: SemanticContextMatch[]
): Promise<RerankResult> {
  const apiKey = process.env.COHERE_API_KEY?.trim()
  if (!apiKey || candidates.length === 0) {
    return { matches: candidates, billedSearchUnits: 0 }
  }

  const maxDocuments = Math.max(1, Math.floor(envNumber("COHERE_RERANK_MAX_DOCS", 20, 1)))
  const topN = Math.max(1, Math.floor(envNumber("COHERE_RERANK_TOP_N", 5, 1)))
  const maxTokensPerDoc = Math.max(
    1,
    Math.floor(envNumber("COHERE_RERANK_MAX_TOKENS_PER_DOC", 2048, 1))
  )
  const timeoutMs = Math.max(500, Math.floor(envNumber("COHERE_RERANK_TIMEOUT_MS", 5000, 500)))
  const documents = candidates.slice(0, maxDocuments)

  const response = await fetch(getRerankUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Client-Name": "semantic-agent",
    },
    body: JSON.stringify({
      model: process.env.COHERE_RERANK_MODEL || "rerank-v5.0-fast",
      query: query.slice(0, 8000),
      documents: documents.map(formatDocument),
      top_n: Math.min(topN, documents.length),
      max_tokens_per_doc: maxTokensPerDoc,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`Cohere Rerank respondeu HTTP ${response.status}`)
  }

  const payload = (await response.json()) as CohereResponse
  const minScore = envNumber("COHERE_RERANK_MIN_SCORE", 0, 0)
  const ranked = (payload.results || [])
    .filter(
      (result) =>
        Number.isInteger(result.index) &&
        result.index! >= 0 &&
        result.index! < documents.length &&
        typeof result.relevance_score === "number" &&
        result.relevance_score >= minScore
    )
    .map((result) => ({
      ...documents[result.index!],
      rerankScore: result.relevance_score,
    }))

  return {
    matches: ranked.length ? ranked : documents.slice(0, Math.min(topN, documents.length)),
    billedSearchUnits: payload.meta?.billed_units?.search_units || 0,
  }
}
