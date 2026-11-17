import { GoogleGenAI } from "@google/genai"

export interface SemanticContextMatch {
  id: string
  score: number
  rerankScore?: number
  text: string
  metadata: Record<string, unknown>
}

interface PineconeQueryResponse {
  matches?: Array<{
    id?: string
    score?: number
    metadata?: Record<string, unknown>
  }>
}

const DEFAULT_NAMESPACE = "eclass-14"
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001"
const DEFAULT_EMBEDDING_DIMENSION = 768

function getPineconeHost(): string | null {
  const host = process.env.PINECONE_INDEX_HOST?.trim()
  if (!host) return null
  return host.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

export function isPineconeConfigured(): boolean {
  return Boolean(process.env.PINECONE_API_KEY?.trim() && getPineconeHost())
}

async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) throw new Error("GEMINI_API_KEY é necessária para consultar o Pinecone")

  const ai = new GoogleGenAI({ apiKey })
  const configuredDimension = Number(
    process.env.PINECONE_EMBEDDING_DIMENSION || DEFAULT_EMBEDDING_DIMENSION
  )
  const result = await ai.models.embedContent({
    model: process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality:
        Number.isInteger(configuredDimension) && configuredDimension > 0
          ? configuredDimension
          : DEFAULT_EMBEDDING_DIMENSION,
    },
  })

  const vector = result.embeddings?.[0]?.values
  if (!vector?.length) throw new Error("O modelo de embeddings não retornou um vetor")
  return vector
}

/**
 * Consults the production Pinecone index when configured. An unavailable or
 * misconfigured RAG never fabricates evidence: callers can fall back to the
 * checked local ECLASS catalog and expose the retrieval source to the client.
 */
export async function retrieveEclassContext(
  queryText: string,
  options: {
    topK?: number
    namespace?: string
    metadataFilter?: Record<string, unknown>
  } = {}
): Promise<SemanticContextMatch[]> {
  const apiKey = process.env.PINECONE_API_KEY?.trim()
  const host = getPineconeHost()
  if (!apiKey || !host) return []

  const vector = await embedQuery(queryText)
  const body: Record<string, unknown> = {
    namespace: options.namespace || process.env.PINECONE_NAMESPACE || DEFAULT_NAMESPACE,
    vector,
    topK: Math.min(Math.max(options.topK ?? 8, 1), 20),
    includeMetadata: true,
  }

  if (options.metadataFilter && Object.keys(options.metadataFilter).length > 0) {
    body.filter = options.metadataFilter
  }

  const response = await fetch(`https://${host}/query`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    throw new Error(`Pinecone respondeu HTTP ${response.status}`)
  }

  const payload = (await response.json()) as PineconeQueryResponse
  return (payload.matches || [])
    .filter((match) => match.id && typeof match.score === "number")
    .map((match) => ({
      id: match.id!,
      score: match.score!,
      metadata: match.metadata || {},
      text: String(match.metadata?.text || match.metadata?.content || match.id),
    }))
}
