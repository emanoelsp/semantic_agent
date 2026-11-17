export interface AgentUsage {
  geminiInputTokens: number
  geminiOutputTokens: number
  geminiTotalTokens: number
  cohereSearchUnits: number
}

export interface ProviderCostEstimate {
  usd: number
  brl: number
  configured: boolean
  breakdown: {
    geminiInputUsd: number
    geminiOutputUsd: number
    cohereUsd: number
  }
}

function envNumber(name: string, fallback = 0): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function estimateProviderCost(usage: AgentUsage): ProviderCostEstimate {
  const geminiInputUsd =
    (usage.geminiInputTokens / 1_000_000) * envNumber("GEMINI_INPUT_USD_PER_1M_TOKENS")
  const geminiOutputUsd =
    (usage.geminiOutputTokens / 1_000_000) * envNumber("GEMINI_OUTPUT_USD_PER_1M_TOKENS")
  const cohereUsd =
    (usage.cohereSearchUnits / 1_000) * envNumber("COHERE_USD_PER_1K_SEARCH_UNITS")
  const usd = geminiInputUsd + geminiOutputUsd + cohereUsd + envNumber("BILLING_INFRA_USD_PER_REQUEST")
  const brl = usd * envNumber("BILLING_USD_TO_BRL")
  const configured = Boolean(
    process.env.BILLING_USD_TO_BRL &&
      (process.env.GEMINI_INPUT_USD_PER_1M_TOKENS ||
        process.env.GEMINI_OUTPUT_USD_PER_1M_TOKENS ||
        process.env.COHERE_USD_PER_1K_SEARCH_UNITS)
  )

  return {
    usd: Number(usd.toFixed(8)),
    brl: Number(brl.toFixed(6)),
    configured,
    breakdown: {
      geminiInputUsd: Number(geminiInputUsd.toFixed(8)),
      geminiOutputUsd: Number(geminiOutputUsd.toFixed(8)),
      cohereUsd: Number(cohereUsd.toFixed(8)),
    },
  }
}
