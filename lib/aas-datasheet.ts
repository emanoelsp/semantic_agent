// =============================================================================
// AAS Generator - Datasheet multi-mapping (IDTA AAS v3.0 Compliant)
// =============================================================================

import type { ToonMapping } from "@/lib/toon-orchestrator-parser"
import type { DatasheetDataPoint } from "@/lib/datasheet-agent"
import {
  buildIdtaAASEnvironment,
  type AASEnvironmentV3,
  type SemanticVariableInput,
} from "@/lib/aas-v3"

export interface DatasheetMapping extends ToonMapping {
  description?: string
  dataType?: string
  unit?: string
}

/**
 * Gera AAS JSON completo v3.0 (IDTA-01001-3-0) a partir de mapeamentos de datasheet,
 * incluindo Nameplate, TechnicalData, OperationalCapabilities, OperationalData e ConceptDescriptions.
 */
export function generateAASFromDatasheetMappings(
  assetId: string,
  assetIdShort: string,
  mappings: DatasheetMapping[],
  dataPoints?: DatasheetDataPoint[],
  metadata?: {
    manufacturerName?: string
    productDesignation?: string
    serialNumber?: string
    yearOfConstruction?: string
  }
): AASEnvironmentV3 {
  const descriptionMap = new Map<string, string>()
  const dataTypeMap = new Map<string, string>()
  if (dataPoints) {
    for (const dp of dataPoints) {
      descriptionMap.set(dp.source_tag, dp.description)
      dataTypeMap.set(dp.source_tag, dp.data_type)
    }
  }

  const variables: SemanticVariableInput[] = mappings.map((m) => ({
    sourceTag: m.source,
    description: m.description ?? descriptionMap.get(m.source) ?? m.target,
    dataType: m.dataType ?? dataTypeMap.get(m.source) ?? "BOOL",
    eclassIrdi: m.eclassId,
    targetName: m.target,
    unit: m.unit,
    action: (m.action as "DirectMap" | "Convert_Unit" | "Aggregate") || "DirectMap",
    confidence: m.confidence ?? 0.92,
  }))

  return buildIdtaAASEnvironment({
    assetId: assetId || assetIdShort,
    manufacturerName: metadata?.manufacturerName,
    productDesignation: metadata?.productDesignation,
    serialNumber: metadata?.serialNumber,
    yearOfConstruction: metadata?.yearOfConstruction,
    variables,
  })
}
