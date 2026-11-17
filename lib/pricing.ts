export type BillingOperation = "mapping" | "datasheet" | "telemetry"

export interface BillingQuoteInput {
  operation: BillingOperation
  inputData?: string
  description?: string
  dataPoints?: number
  pdfBytes?: number
  telemetryPoints?: number
  edgeMessages?: number
}

export interface BillingQuote {
  operation: BillingOperation
  credits: number
  priceBRL: number
  creditValueBRL: number
  breakdown: Record<string, number>
  isEstimate: true
}

function envNumber(name: string, fallback: number, min = 0): number {
  const parsed = Number(process.env[name])
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback
}

function clampCredits(value: number): number {
  const min = Math.max(1, Math.floor(envNumber("BILLING_MIN_CHARGE_CREDITS", 1, 1)))
  const max = Math.max(min, Math.floor(envNumber("BILLING_MAX_CHARGE_CREDITS", 10_000, min)))
  return Math.min(max, Math.max(min, Math.ceil(value)))
}

function priceForCredits(credits: number): number {
  const creditValue = envNumber("BILLING_CREDIT_VALUE_BRL", 0.1, 0.0001)
  return Number((credits * creditValue).toFixed(2))
}

export function quoteBilling(input: BillingQuoteInput): BillingQuote {
  const breakdown: Record<string, number> = {}
  let rawCredits = 0

  if (input.operation === "mapping") {
    const base = envNumber("BILLING_MAPPING_BASE_CREDITS", 1, 0)
    const blockChars = Math.max(1, Math.floor(envNumber("BILLING_MAPPING_DESCRIPTION_BLOCK_CHARS", 2_000, 1)))
    const blockCredits = envNumber("BILLING_MAPPING_DESCRIPTION_BLOCK_CREDITS", 1, 0)
    const descriptionChars = (input.description || "").length
    const descriptionBlocks = Math.ceil(descriptionChars / blockChars)

    breakdown.base = base
    breakdown.descriptionBlocks = descriptionBlocks
    breakdown.descriptionCredits = descriptionBlocks * blockCredits
    rawCredits = base + breakdown.descriptionCredits
  }

  if (input.operation === "datasheet") {
    const base = envNumber("BILLING_DATASHEET_BASE_CREDITS", 5, 0)
    const perDataPoint = envNumber("BILLING_DATASHEET_PER_DATAPOINT_CREDITS", 1, 0)
    const perMb = envNumber("BILLING_DATASHEET_PER_MB_CREDITS", 1, 0)
    const dataPoints = Math.max(0, Math.floor(input.dataPoints || 0))
    const pdfMegabytes = Math.ceil(Math.max(0, input.pdfBytes || 0) / (1024 * 1024))

    breakdown.base = base
    breakdown.dataPoints = dataPoints
    breakdown.dataPointCredits = dataPoints * perDataPoint
    breakdown.pdfMegabytes = pdfMegabytes
    breakdown.pdfSizeCredits = pdfMegabytes * perMb
    rawCredits = base + breakdown.dataPointCredits + breakdown.pdfSizeCredits
  }

  if (input.operation === "telemetry") {
    const pointsPerCredit = Math.max(
      1,
      Math.floor(envNumber("BILLING_TELEMETRY_POINTS_PER_CREDIT", 1_000, 1))
    )
    const messagesPerCredit = Math.max(
      1,
      Math.floor(envNumber("BILLING_EDGE_MESSAGES_PER_CREDIT", 1_000, 1))
    )
    const telemetryPoints = Math.max(0, Math.floor(input.telemetryPoints || 0))
    const edgeMessages = Math.max(0, Math.floor(input.edgeMessages || 0))
    const pointCredits = Math.ceil(telemetryPoints / pointsPerCredit)
    const messageCredits = Math.ceil(edgeMessages / messagesPerCredit)

    breakdown.telemetryPoints = telemetryPoints
    breakdown.pointCredits = pointCredits
    breakdown.edgeMessages = edgeMessages
    breakdown.messageCredits = messageCredits
    rawCredits = pointCredits + messageCredits
  }

  const credits = clampCredits(rawCredits)
  return {
    operation: input.operation,
    credits,
    priceBRL: priceForCredits(credits),
    creditValueBRL: envNumber("BILLING_CREDIT_VALUE_BRL", 0.1, 0.0001),
    breakdown,
    isEstimate: true,
  }
}
