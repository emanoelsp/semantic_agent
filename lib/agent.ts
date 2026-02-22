// =============================================================================
// Agent LLM - Lógica central de chamada ao Gemini
// =============================================================================
// Exporta a função que invoca o Gemini para mapeamento semântico.
// Usada por /api/agent e pelo orquestrador.
// =============================================================================

import { GoogleGenAI } from "@google/genai"
import { readFileSync } from "fs"
import { join } from "path"
import { AGENT_TOOLS } from "@/tools"

const SYSTEM_PROMPT_PATH = join(process.cwd(), "prompts", "system_prompt.txt")

function getSystemPrompt(): string {
  try {
    return readFileSync(SYSTEM_PROMPT_PATH, "utf-8")
  } catch {
    return `Você é um Agente Cognitivo Industrial. Responda APENAS no formato TOON:
⟨MAP_START⟩⟨SRC:[tag]⟩⟨TGT:[eclass]⟩⟨CONF:[0.0-1.0]⟩⟨MAP_END⟩
Se integração: ⟨ACTION:GENERATE_NODE_RED⟩
NUNCA converse. NUNCA justifique.`
  }
}

export interface AgentInput {
  inputData: string
  inputType?: "brownfield" | "greenfield"
}

export interface AgentOutput {
  toonOutput: string
}

/** Converte input em formato TOON compacto para economia de tokens */
export function inputToToon(input: AgentInput): string {
  const type = input.inputType ?? "brownfield"
  return `⟨REQ⟩⟨TAG:${input.inputData}⟩⟨TYPE:${type}⟩⟨REQ_END⟩`
}

/**
 * Invoca o Gemini para mapeamento semântico.
 * Input e output em TOON para economia de tokens.
 */
export async function invokeAgent(input: AgentInput): Promise<AgentOutput> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada")
  }

  const ai = new GoogleGenAI({ apiKey })
  const userToon = inputToToon(input)

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userToon,
    config: {
      systemInstruction: getSystemPrompt(),
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 512,
        tools: AGENT_TOOLS as object[],
    },
  })

  const text = response.text?.trim() ?? ""
  if (!text) {
    throw new Error("Resposta vazia do modelo")
  }

  return { toonOutput: text }
}
