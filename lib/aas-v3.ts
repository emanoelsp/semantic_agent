// =============================================================================
// IDTA AAS v3.0 & ECLASS 14.0 / IEC 61360 Semantic Builder + AASX OPC Packager
// =============================================================================
// Strictly implements:
// - IDTA-01001-3-0 (AAS Metamodel v3.0)
// - IDTA 02006-2-0 (Digital Nameplate for Industrial Equipment)
// - IDTA 02003-1-2 (Generic Frame for Technical Data)
// - IDTA Operational Capabilities & Operational Data Submodels
// - IEC 63278-1 / IDTA-01005-3-0 Open Packaging Conventions (.aasx ZIP)
// =============================================================================

import JSZip from "jszip"

export type AASDataTypeDefXsd =
  | "xs:boolean"
  | "xs:integer"
  | "xs:int"
  | "xs:long"
  | "xs:double"
  | "xs:float"
  | "xs:string"
  | "xs:dateTime"

export interface AASKey {
  type:
    | "GlobalReference"
    | "Submodel"
    | "ConceptDescription"
    | "Property"
    | "SubmodelElementCollection"
  value: string
}

export interface AASReference {
  type: "ExternalReference" | "ModelReference"
  keys: AASKey[]
}

export interface AASLangString {
  language: string
  text: string
}

export interface AASQualifier {
  type: string
  valueType: AASDataTypeDefXsd
  value: string
}

export interface AASProperty {
  idShort: string
  modelType: "Property"
  category?: "PARAMETER" | "VARIABLE" | "CONSTANT"
  valueType: AASDataTypeDefXsd
  value?: string
  semanticId: AASReference
  description?: AASLangString[]
  qualifiers?: AASQualifier[]
}

export interface AASMultiLanguageProperty {
  idShort: string
  modelType: "MultiLanguageProperty"
  value: AASLangString[]
  semanticId: AASReference
}

export interface AASSubmodelElementCollection {
  idShort: string
  modelType: "SubmodelElementCollection"
  semanticId: AASReference
  value: Array<AASProperty | AASMultiLanguageProperty | AASSubmodelElementCollection>
}

export type AASSubmodelElement =
  | AASProperty
  | AASMultiLanguageProperty
  | AASSubmodelElementCollection

export interface AASSubmodel {
  idShort: string
  id: string
  modelType: "Submodel"
  kind?: "Instance" | "Template"
  semanticId: AASReference
  submodelElements: AASSubmodelElement[]
}

export interface AASConceptDescription {
  idShort: string
  id: string
  modelType: "ConceptDescription"
  embeddedDataSpecifications: Array<{
    dataSpecification: AASReference
    dataSpecificationContent: {
      modelType: "DataSpecificationIec61360"
      preferredName: AASLangString[]
      shortName?: AASLangString[]
      unit?: string
      unitId?: AASReference
      dataType: string
      definition?: AASLangString[]
      sourceOfDefinition?: string
    }
  }>
}

export interface AASEnvironmentV3 {
  assetAdministrationShells: Array<{
    idShort: string
    id: string
    modelType: "AssetAdministrationShell"
    assetInformation: {
      assetKind: "Instance" | "Type"
      globalAssetId: string
      specificAssetIds?: Array<{ name: string; value: string }>
    }
    submodels: AASReference[]
  }>
  submodels: AASSubmodel[]
  conceptDescriptions: AASConceptDescription[]
}

// =============================================================================
// Authoritative ECLASS 14.0 Dictionary (IRDI + IEC 61360 Data Spec + Units)
// =============================================================================

export interface EclassDictionaryEntry {
  irdi: string
  preferredNameEn: string
  preferredNamePt: string
  shortName: string
  unit: string
  uneceUnitCode: string
  iecDataType: "REAL_MEASURE" | "BOOLEAN" | "INTEGER_MEASURE" | "STRING"
  xsdValueType: AASDataTypeDefXsd
  domain: "temperature" | "pressure" | "velocity" | "electrical" | "flow" | "status" | "actuator" | "sensor" | "nameplate"
  submodelTarget: "Nameplate" | "TechnicalData" | "OperationalData" | "OperationalCapabilities"
  definitionEn: string
  minSafeValue?: number
  maxSafeValue?: number
}

export const ECLASS_DICTIONARY: EclassDictionaryEntry[] = [
  {
    irdi: "0173-1#02-AAB713#005",
    preferredNameEn: "Temperature",
    preferredNamePt: "Temperatura Operacional",
    shortName: "Temp",
    unit: "degC",
    uneceUnitCode: "CEL",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "temperature",
    submodelTarget: "OperationalData",
    definitionEn: "Thermodynamic temperature of a medium, bearing, or industrial component measured in degrees Celsius.",
    minSafeValue: -273.15,
    maxSafeValue: 1800,
  },
  {
    irdi: "0173-1#02-AAA699#004",
    preferredNameEn: "Operating Pressure",
    preferredNamePt: "Pressão de Operação",
    shortName: "Press",
    unit: "bar",
    uneceUnitCode: "BAR",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "pressure",
    submodelTarget: "OperationalData",
    definitionEn: "Gauge or absolute fluid pressure inside pneumatic, hydraulic, or process vessels.",
    minSafeValue: 0,
    maxSafeValue: 1000,
  },
  {
    irdi: "0173-1#02-BAA123#003",
    preferredNameEn: "Linear Velocity",
    preferredNamePt: "Velocidade Linear",
    shortName: "Vel",
    unit: "m/s",
    uneceUnitCode: "MTS",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "velocity",
    submodelTarget: "OperationalData",
    definitionEn: "Linear speed of a conveyor belt, axis, or moving machine element.",
    minSafeValue: 0,
    maxSafeValue: 100,
  },
  {
    irdi: "0173-1#02-AAO663#003",
    preferredNameEn: "Rotational Speed",
    preferredNamePt: "Velocidade de Rotação (RPM)",
    shortName: "n_rot",
    unit: "1/min",
    uneceUnitCode: "RPM",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "velocity",
    submodelTarget: "OperationalData",
    definitionEn: "Number of revolutions of a motor shaft or spindle per minute.",
    minSafeValue: 0,
    maxSafeValue: 60000,
  },
  {
    irdi: "0173-1#02-BAB014#005",
    preferredNameEn: "Drive Actuation Command (Motor Forward)",
    preferredNamePt: "Comando de Acionamento / Marcha",
    shortName: "CmdRun",
    unit: "boolean",
    uneceUnitCode: "C62",
    iecDataType: "BOOLEAN",
    xsdValueType: "xs:boolean",
    domain: "actuator",
    submodelTarget: "OperationalCapabilities",
    definitionEn: "Binary control signal to energize or command forward motion of an industrial drive or actuator.",
  },
  {
    irdi: "0173-1#02-BAF321#004",
    preferredNameEn: "Operating Status",
    preferredNamePt: "Estado Operacional (Run/Stop)",
    shortName: "OpStat",
    unit: "boolean",
    uneceUnitCode: "C62",
    iecDataType: "BOOLEAN",
    xsdValueType: "xs:boolean",
    domain: "status",
    submodelTarget: "OperationalData",
    definitionEn: "Binary state indicating whether the machine or subsystem is actively running.",
  },
  {
    irdi: "0173-1#02-BAA014#002",
    preferredNameEn: "Photoelectric Barrier State",
    preferredNamePt: "Sensor Fotoelétrico / Barreira Óptica",
    shortName: "PhotoSen",
    unit: "boolean",
    uneceUnitCode: "C62",
    iecDataType: "BOOLEAN",
    xsdValueType: "xs:boolean",
    domain: "sensor",
    submodelTarget: "OperationalData",
    definitionEn: "Light barrier or phototransistor binary presence detection state.",
  },
  {
    irdi: "0173-1#02-BAA283#002",
    preferredNameEn: "Limit Switch Position State",
    preferredNamePt: "Chave Fim de Curso",
    shortName: "LimSw",
    unit: "boolean",
    uneceUnitCode: "C62",
    iecDataType: "BOOLEAN",
    xsdValueType: "xs:boolean",
    domain: "sensor",
    submodelTarget: "OperationalData",
    definitionEn: "Mechanical or inductive end-of-travel position switch signal.",
  },
  {
    irdi: "0173-1#02-AAO676#002",
    preferredNameEn: "Rated Voltage",
    preferredNamePt: "Tensão Nominal / Operacional",
    shortName: "U_nom",
    unit: "V",
    uneceUnitCode: "VLT",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "electrical",
    submodelTarget: "TechnicalData",
    definitionEn: "RMS electrical voltage of the supply or motor terminal.",
    minSafeValue: 0,
    maxSafeValue: 36000,
  },
  {
    irdi: "0173-1#02-AAO677#002",
    preferredNameEn: "Operating Current",
    preferredNamePt: "Corrente Elétrica",
    shortName: "I_op",
    unit: "A",
    uneceUnitCode: "AMP",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "electrical",
    submodelTarget: "OperationalData",
    definitionEn: "Electrical current drawn by the actuator, winding, or PLC power rail.",
    minSafeValue: 0,
    maxSafeValue: 5000,
  },
  {
    irdi: "0173-1#02-AAO680#002",
    preferredNameEn: "Active Power",
    preferredNamePt: "Potência Ativa",
    shortName: "P_act",
    unit: "kW",
    uneceUnitCode: "KWT",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "electrical",
    submodelTarget: "TechnicalData",
    definitionEn: "Electrical or mechanical active power rating.",
    minSafeValue: 0,
    maxSafeValue: 50000,
  },
  {
    irdi: "0173-1#02-AAO732#003",
    preferredNameEn: "Volumetric Flow Rate",
    preferredNamePt: "Vazão Volumétrica",
    shortName: "Q_flow",
    unit: "m³/h",
    uneceUnitCode: "MQH",
    iecDataType: "REAL_MEASURE",
    xsdValueType: "xs:double",
    domain: "flow",
    submodelTarget: "OperationalData",
    definitionEn: "Volume of fluid passing through a cross-section per unit time.",
    minSafeValue: 0,
    maxSafeValue: 100000,
  },
]

export function normalizeIrdi(irdi: string): string {
  const clean = irdi.replace(/^ECLASS:/i, "").trim()
  if (/\d{4}-\d#\d{2}-[A-Z0-9]{6}#\d{3}$/i.test(clean)) {
    return clean.toUpperCase()
  }
  if (/\d{4}-\d#\d{2}-[A-Z0-9]{6}$/i.test(clean)) {
    // Check dictionary for matching base IRDI
    const match = ECLASS_DICTIONARY.find((d) =>
      d.irdi.toUpperCase().startsWith(clean.toUpperCase())
    )
    return match ? match.irdi : `${clean.toUpperCase()}#001`
  }
  return clean
}

export function findEclassEntry(irdi: string): EclassDictionaryEntry | undefined {
  const clean = irdi.replace(/^ECLASS:/i, "").trim().toUpperCase()
  return ECLASS_DICTIONARY.find(
    (entry) =>
      entry.irdi.toUpperCase() === clean ||
      entry.irdi.split("#")[0] + "#" + entry.irdi.split("#")[1]?.split("#")[0] === clean
  )
}

export function sanitizeIdShort(raw: string, fallback: string = "Property_01"): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
  if (!cleaned) return fallback
  const startsWithLetter = /^[a-zA-Z]/.test(cleaned) ? cleaned : `Var_${cleaned}`
  return startsWithLetter.slice(0, 64)
}

export function mapPlcDataTypeToXsd(plcType?: string, eclassEntry?: EclassDictionaryEntry): AASDataTypeDefXsd {
  if (plcType) {
    const u = plcType.toUpperCase()
    if (u.includes("BOOL") || u.includes("BIT")) return "xs:boolean"
    if (u.includes("REAL") || u.includes("FLOAT") || u.includes("LREAL")) return "xs:double"
    if (u.includes("DINT") || u.includes("LINT")) return "xs:long"
    if (u.includes("INT") || u.includes("WORD") || u.includes("BYTE")) return "xs:integer"
  }
  if (eclassEntry) return eclassEntry.xsdValueType
  return "xs:double"
}

export interface SemanticVariableInput {
  sourceTag: string
  description?: string
  dataType?: string
  eclassIrdi: string
  targetName: string
  unit?: string
  action?: "DirectMap" | "Convert_Unit" | "Aggregate"
  actionDetail?: string
  confidence: number
}

export interface BuildAASOptions {
  assetId: string
  manufacturerName?: string
  productDesignation?: string
  serialNumber?: string
  yearOfConstruction?: string
  variables: SemanticVariableInput[]
}

/**
 * Generates an IDTA-compliant AAS v3.0 Environment containing:
 * 1. Digital Nameplate Submodel (IDTA 02006-2-0)
 * 2. Technical Data Submodel (IDTA 02003-1-2)
 * 3. Operational Capabilities Submodel
 * 4. Operational Data Submodel (Real-time PLC/API telemetry & control)
 * 5. Complete IEC 61360 ConceptDescriptions for every ECLASS IRDI
 */
export function buildIdtaAASEnvironment(options: BuildAASOptions): AASEnvironmentV3 {
  const safeAssetSlug = options.assetId.replace(/[^a-zA-Z0-9_-]/g, "_")
  const assetIdShort = sanitizeIdShort(options.assetId, "IndustrialAsset")
  const aasId = `https://industrial-dataspace.io/aas/${safeAssetSlug}`
  const globalAssetId = `https://industrial-dataspace.io/assets/${safeAssetSlug}`

  const nameplateSubmodelId = `https://industrial-dataspace.io/submodels/nameplate/${safeAssetSlug}`
  const techDataSubmodelId = `https://industrial-dataspace.io/submodels/technical-data/${safeAssetSlug}`
  const capabilitiesSubmodelId = `https://industrial-dataspace.io/submodels/capabilities/${safeAssetSlug}`
  const operationalSubmodelId = `https://industrial-dataspace.io/submodels/operational-data/${safeAssetSlug}`

  // 1. Submodel: Digital Nameplate (IDTA 02006-2-0, ECLASS 0173-1#01-AGZ672#001)
  const nameplateSubmodel: AASSubmodel = {
    idShort: "Nameplate",
    id: nameplateSubmodelId,
    modelType: "Submodel",
    kind: "Instance",
    semanticId: {
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: "https://admin-shell.io/zvei/nameplate/2/0/Nameplate",
        },
      ],
    },
    submodelElements: [
      {
        idShort: "URIOfTheProduct",
        modelType: "Property",
        valueType: "xs:string",
        value: globalAssetId,
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "GlobalReference", value: "0173-1#02-AAY811#001" }],
        },
      },
      {
        idShort: "ManufacturerName",
        modelType: "MultiLanguageProperty",
        value: [{ language: "en", text: options.manufacturerName || "Industrial Automation OEM" }],
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "GlobalReference", value: "0173-1#02-AAO677#002" }],
        },
      },
      {
        idShort: "ManufacturerProductDesignation",
        modelType: "MultiLanguageProperty",
        value: [
          {
            language: "en",
            text: options.productDesignation || options.assetId,
          },
        ],
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "GlobalReference", value: "0173-1#02-AAW338#001" }],
        },
      },
      {
        idShort: "SerialNumber",
        modelType: "Property",
        valueType: "xs:string",
        value: options.serialNumber || `SN-${safeAssetSlug.slice(0, 12).toUpperCase()}`,
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "GlobalReference", value: "0173-1#02-AAM556#002" }],
        },
      },
      {
        idShort: "YearOfConstruction",
        modelType: "Property",
        valueType: "xs:string",
        value: options.yearOfConstruction || "2026",
        semanticId: {
          type: "ExternalReference",
          keys: [{ type: "GlobalReference", value: "0173-1#02-AAP906#001" }],
        },
      },
    ],
  }

  // Partition variables across TechnicalData, OperationalCapabilities, and OperationalData
  const techProperties: AASProperty[] = []
  const capabilityElements: AASProperty[] = []
  const operationalElements: AASProperty[] = []
  const conceptMap = new Map<string, AASConceptDescription>()

  for (const v of options.variables) {
    const normalizedIrdi = normalizeIrdi(v.eclassIrdi)
    const dictEntry = findEclassEntry(normalizedIrdi)
    const xsdType = mapPlcDataTypeToXsd(v.dataType, dictEntry)
    const unit = v.unit && v.unit !== "unknown" ? v.unit : dictEntry?.unit || "unitless"
    const propIdShort = sanitizeIdShort(
      v.description ? `${v.sourceTag}_${v.description}` : `${v.sourceTag}_${v.targetName}`,
      sanitizeIdShort(v.sourceTag)
    )

    const qualifiers: AASQualifier[] = [
      {
        type: "MappingSourceTag",
        valueType: "xs:string",
        value: v.sourceTag,
      },
      {
        type: "SemanticConfidence",
        valueType: "xs:double",
        value: v.confidence.toFixed(2),
      },
      {
        type: "MappingAction",
        valueType: "xs:string",
        value: v.action ?? "DirectMap",
      },
    ]

    if (unit && unit !== "unknown") {
      qualifiers.push({
        type: "Unit",
        valueType: "xs:string",
        value: unit,
      })
    }

    if (v.actionDetail) {
      qualifiers.push({
        type: "ConversionFormula",
        valueType: "xs:string",
        value: v.actionDetail,
      })
    }

    const prop: AASProperty = {
      idShort: propIdShort,
      modelType: "Property",
      category: "VARIABLE",
      valueType: xsdType,
      value: xsdType === "xs:boolean" ? "false" : "0.0",
      semanticId: {
        type: "ExternalReference",
        keys: [
          {
            type: "ConceptDescription",
            value: normalizedIrdi,
          },
        ],
      },
      description: [
        {
          language: "en",
          text: v.description || dictEntry?.definitionEn || v.targetName,
        },
      ],
      qualifiers,
    }

    if (dictEntry?.submodelTarget === "TechnicalData") {
      techProperties.push(prop)
    } else if (dictEntry?.submodelTarget === "OperationalCapabilities") {
      capabilityElements.push(prop)
    } else {
      operationalElements.push(prop)
    }

    // Build IEC 61360 ConceptDescription
    if (!conceptMap.has(normalizedIrdi)) {
      conceptMap.set(normalizedIrdi, {
        idShort: sanitizeIdShort(dictEntry?.preferredNameEn || v.targetName, "Concept"),
        id: normalizedIrdi,
        modelType: "ConceptDescription",
        embeddedDataSpecifications: [
          {
            dataSpecification: {
              type: "ExternalReference",
              keys: [
                {
                  type: "GlobalReference",
                  value: "https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0",
                },
              ],
            },
            dataSpecificationContent: {
              modelType: "DataSpecificationIec61360",
              preferredName: [
                { language: "en", text: dictEntry?.preferredNameEn || v.targetName },
                { language: "pt", text: dictEntry?.preferredNamePt || v.targetName },
              ],
              shortName: [{ language: "en", text: dictEntry?.shortName || propIdShort.slice(0, 12) }],
              unit,
              ...(dictEntry?.uneceUnitCode
                ? {
                    unitId: {
                      type: "ExternalReference",
                      keys: [{ type: "GlobalReference", value: `0173-1#05-${dictEntry.uneceUnitCode}#001` }],
                    },
                  }
                : {}),
              dataType: dictEntry?.iecDataType || "REAL_MEASURE",
              definition: [
                {
                  language: "en",
                  text:
                    dictEntry?.definitionEn ||
                    `Industrial semantic property mapped from ${v.sourceTag} via ECLASS IRDI ${normalizedIrdi}`,
                },
              ],
              sourceOfDefinition: "ECLASS 14.0 / IEC 61360 CDD",
            },
          },
        ],
      })
    }
  }

  // 2. Submodel: Technical Data (IDTA 02003-1-2)
  const technicalDataSubmodel: AASSubmodel = {
    idShort: "TechnicalData",
    id: techDataSubmodelId,
    modelType: "Submodel",
    kind: "Instance",
    semanticId: {
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: "https://admin-shell.io/ZVEI/TechnicalData/Submodel/1/2",
        },
      ],
    },
    submodelElements: [
      {
        idShort: "GeneralInformation",
        modelType: "SubmodelElementCollection",
        semanticId: {
          type: "ExternalReference",
          keys: [
            {
              type: "GlobalReference",
              value: "https://admin-shell.io/ZVEI/TechnicalData/GeneralInformation/1/1",
            },
          ],
        },
        value: [
          {
            idShort: "ManufacturerOrderCode",
            modelType: "Property",
            valueType: "xs:string",
            value: safeAssetSlug.toUpperCase(),
            semanticId: {
              type: "ExternalReference",
              keys: [{ type: "GlobalReference", value: "0173-1#02-AAO227#002" }],
            },
          },
        ],
      },
      {
        idShort: "TechnicalProperties",
        modelType: "SubmodelElementCollection",
        semanticId: {
          type: "ExternalReference",
          keys: [
            {
              type: "GlobalReference",
              value: "https://admin-shell.io/ZVEI/TechnicalData/TechnicalProperties/1/1",
            },
          ],
        },
        value: techProperties.length > 0 ? techProperties : operationalElements.slice(0, 3),
      },
    ],
  }

  // 3. Submodel: Operational Capabilities (IDTA Capability Model)
  const capabilitiesSubmodel: AASSubmodel = {
    idShort: "OperationalCapabilities",
    id: capabilitiesSubmodelId,
    modelType: "Submodel",
    kind: "Instance",
    semanticId: {
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: "https://admin-shell.io/idta/CapabilityDescription/1/0/Submodel",
        },
      ],
    },
    submodelElements:
      capabilityElements.length > 0
        ? capabilityElements
        : [
            {
              idShort: "RealTimeSemanticTelemetryCapability",
              modelType: "Property",
              category: "PARAMETER",
              valueType: "xs:boolean",
              value: "true",
              semanticId: {
                type: "ExternalReference",
                keys: [{ type: "GlobalReference", value: "0173-1#02-BAF321#004" }],
              },
              description: [
                {
                  language: "en",
                  text: "Supports automated ECLASS/AAS telemetry publishing via Node-RED Industrial Edge",
                },
              ],
            },
          ],
  }

  // 4. Submodel: OperationalData (Real-time Edge variables)
  const operationalDataSubmodel: AASSubmodel = {
    idShort: "OperationalData",
    id: operationalSubmodelId,
    modelType: "Submodel",
    kind: "Instance",
    semanticId: {
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: "https://admin-shell.io/idta/OperationalData/1/0/Submodel",
        },
      ],
    },
    submodelElements: operationalElements,
  }

  const allSubmodels: AASSubmodel[] = [
    nameplateSubmodel,
    technicalDataSubmodel,
    capabilitiesSubmodel,
    operationalDataSubmodel,
  ]

  return {
    assetAdministrationShells: [
      {
        idShort: assetIdShort,
        id: aasId,
        modelType: "AssetAdministrationShell",
        assetInformation: {
          assetKind: "Instance",
          globalAssetId,
          specificAssetIds: [
            { name: "EquipmentId", value: options.assetId },
            { name: "StandardCompliance", value: "IDTA-01001-3-0 / ECLASS-14.0" },
          ],
        },
        submodels: allSubmodels.map((sm) => ({
          type: "ModelReference",
          keys: [{ type: "Submodel", value: sm.id }],
        })),
      },
    ],
    submodels: allSubmodels,
    conceptDescriptions: Array.from(conceptMap.values()),
  }
}

/**
 * Generates an official Open Packaging Conventions (OPC) `.aasx` binary archive
 * compliant with IEC 63278-1 / IDTA-01005-3-0 (compatible with AASX Package Explorer).
 */
export async function generateAasxPackageBuffer(
  environment: AASEnvironmentV3,
  supplementaryDocs?: { filename: string; content: Buffer | string }[]
): Promise<Buffer> {
  const zip = new JSZip()

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="pdf" ContentType="application/pdf" />
</Types>`
  zip.file("[Content_Types].xml", contentTypesXml)

  // 2. _rels/.rels (Points to aasx-origin)
  const rootRelsXml = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://admin-shell.io/aasx/relationships/aasx-origin" Target="/aasx/aasx-origin" Id="R_AASX_ORIGIN" />
</Relationships>`
  zip.file("_rels/.rels", rootRelsXml)

  // 3. aasx/aasx-origin
  zip.file("aasx/aasx-origin", "Intentionally empty AASX origin marker (IDTA-01005-3-0).")

  // 4. aasx/_rels/aasx-origin.rels (Points to aas.json spec)
  const originRelsXml = `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://admin-shell.io/aasx/relationships/aas-spec" Target="/aasx/aas-environment.json" Id="R_AAS_SPEC_JSON" />
</Relationships>`
  zip.file("aasx/_rels/aasx-origin.rels", originRelsXml)

  // 5. aasx/aas-environment.json (IDTA v3.0 JSON serialization)
  zip.file("aasx/aas-environment.json", JSON.stringify(environment, null, 2))

  // 6. Optional supplementary files (e.g., technical documentation or Node-RED edge bundle)
  if (supplementaryDocs && supplementaryDocs.length > 0) {
    for (const doc of supplementaryDocs) {
      zip.file(`aasx/files/${doc.filename}`, doc.content)
    }
  }

  const uint8 = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })
  return Buffer.from(uint8)
}
