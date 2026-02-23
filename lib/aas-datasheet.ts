// =============================================================================
// AAS Generator - Datasheet multi-mapping
// =============================================================================
// Gera Asset Administration Shell a partir de múltiplos mapeamentos TOON
// conforme estrutura fischertechnik / Plattform Industrie 4.0
// =============================================================================

import type { ToonMapping } from "@/lib/toon-orchestrator-parser"
import type { DatasheetDataPoint } from "@/lib/datasheet-agent"

export interface DatasheetMapping extends ToonMapping {
  description?: string
  dataType?: string
}

function toIdShort(description: string, sourceTag: string): string {
  const safe = description
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40)
  return safe || sourceTag.replace(/[^a-zA-Z0-9]/g, "_")
}

function inferValueType(dataType: string): string {
  const u = dataType.toUpperCase()
  if (u.includes("BOOL")) return "boolean"
  if (u.includes("INT") || u.includes("DINT") || u.includes("WORD")) return "integer"
  if (u.includes("REAL") || u.includes("FLOAT")) return "double"
  return "string"
}

/**
 * Gera AAS JSON a partir de mapeamentos datasheet.
 */
export function generateAASFromDatasheetMappings(
  assetId: string,
  assetIdShort: string,
  mappings: DatasheetMapping[],
  dataPoints?: DatasheetDataPoint[]
): object {
  const descriptionMap = new Map<string, string>()
  const dataTypeMap = new Map<string, string>()
  if (dataPoints) {
    for (const dp of dataPoints) {
      descriptionMap.set(dp.source_tag, dp.description)
      dataTypeMap.set(dp.source_tag, dp.data_type)
    }
  }

  const submodelElements = mappings.map((m) => {
    const desc = m.description ?? descriptionMap.get(m.source) ?? m.target
    const dataType = m.dataType ?? dataTypeMap.get(m.source) ?? "BOOL"
    const valueType = inferValueType(dataType)
    const idShort = toIdShort(desc, m.source)

    return {
      idShort,
      modelType: "Property",
      valueType,
      semanticId: {
        keys: [
          {
            type: "ConceptDescription",
            value: /\d{4}-\d#\d{2}-[A-Z0-9]+#\d{3}$/.test(m.eclassId)
              ? m.eclassId
              : `${m.eclassId}#005`,
          },
        ],
      },
      description: [{ language: "en", text: desc }],
      qualifiers: [{ type: "Mapping_Source", value: m.source }],
    }
  })

  const aas = {
    assetAdministrationShells: [
      {
        idShort: assetIdShort,
        identification: {
          idType: "URI",
          id: `http://industrial.io/assets/${assetId}/instance/01`,
        },
        submodels: [
          {
            idShort: "OperationalVariables",
            semanticId: {
              keys: [
                {
                  type: "GlobalReference",
                  value: "http://admin-shell.io/submodels/OperationalData/1/0",
                },
              ],
            },
            submodelElements,
          },
        ],
      },
    ],
  }

  return aas
}
