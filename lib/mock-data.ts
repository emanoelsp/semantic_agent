// =============================================================================
// Semantic Agent - Core Types & IDTA v3.0 / Node-RED Generators
// =============================================================================

import { buildIdtaAASEnvironment, type AASEnvironmentV3 } from "@/lib/aas-v3"

export interface ReasoningStep {
  step: number
  action: string
  detail: string
  timestamp: string
}

export interface ToonMapping {
  source: string
  target: string
  eclassId: string
  action: "DirectMap" | "Convert_Unit" | "Aggregate"
  actionDetail?: string
  unit?: string
}

export interface ProcessingResult {
  status: "success" | "warning" | "error"
  inputType: "brownfield" | "greenfield"
  inputData: string
  reasoningSteps: ReasoningStep[]
  toonOutput: string
  toonMapping: ToonMapping
  confidence: number
  aasPreview: Record<string, unknown>
  processingTimeMs: number
  hitlReviewId?: string
  uncertaintyReasons?: string[]
  physicalWarning?: string
  remainingCredits?: number
}

const KNOWN_MAPPINGS: Record<string, Omit<ProcessingResult, "inputData" | "processingTimeMs">> = {
  "DB10.W2": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Análise Léxica CLP", detail: "Tag 'DB10.W2' — Siemens S7 (Data Block 10, Word 2)", timestamp: "0.12s" },
      { step: 2, action: "Catálogo ECLASS 14.0", detail: "Buscando IRDI e especificação IEC 61360...", timestamp: "0.45s" },
      { step: 3, action: "Inferência Semântica", detail: "Probabilidade 92% para 'Linear Velocity (Conveyor)'", timestamp: "1.02s" },
      { step: 4, action: "Alinhamento IDTA", detail: "Mapeado para ECLASS: 0173-1#02-BAA123#003 (Linear Velocity)", timestamp: "1.34s" },
      { step: 5, action: "Validação TOON", detail: "Gramática BNF validada (100% conformidade)", timestamp: "1.52s" },
    ],
    toonOutput: "⟨MAP_START⟩⟨SRC:DB10.W2⟩⟨TGT:ECLASS:0173-1#02-BAA123#003⟩⟨CONF:0.92⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    toonMapping: {
      source: "DB10.W2",
      target: "Linear Velocity",
      eclassId: "0173-1#02-BAA123#003",
      action: "DirectMap",
      unit: "m/s",
    },
    confidence: 0.92,
    aasPreview: {
      idShort: "ConveyorBeltSpeed",
      semanticId: "0173-1#02-BAA123#003",
      valueType: "xs:double",
      value: "0.0",
      qualifiers: [{ type: "Unit", valueType: "xs:string", value: "m/s" }],
    },
  },
  "DB1.W0": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Análise Léxica CLP", detail: "Tag 'DB1.W0' — Siemens S7 (Data Block 1, Word 0)", timestamp: "0.10s" },
      { step: 2, action: "Contexto Funcional", detail: "Descrição 'Comando de marcha da esteira'", timestamp: "0.15s" },
      { step: 3, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-BAB014#005 (Drive Actuation Command)", timestamp: "0.95s" },
      { step: 4, action: "Validação TOON", detail: "Gramática BNF validada (100% conformidade)", timestamp: "1.12s" },
    ],
    toonOutput: "⟨MAP_START⟩⟨SRC:DB1.W0⟩⟨TGT:ECLASS:0173-1#02-BAB014#005⟩⟨CONF:0.95⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    toonMapping: {
      source: "DB1.W0",
      target: "Drive Actuation Command (Motor Forward)",
      eclassId: "0173-1#02-BAB014#005",
      action: "DirectMap",
      unit: "boolean",
    },
    confidence: 0.95,
    aasPreview: {
      idShort: "Comando_Acionamento_Esteira",
      semanticId: "0173-1#02-BAB014#005",
      valueType: "xs:boolean",
      value: "false",
      qualifiers: [
        { type: "MappingSourceTag", valueType: "xs:string", value: "DB1.W0" },
        { type: "Protocol", valueType: "xs:string", value: "S7comm / OPC UA" },
      ],
    },
  },
  "DB1.DBX0.1": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Análise Léxica CLP", detail: "Tag 'DB1.DBX0.1' — Siemens S7 (Data Block 1, Bit 0.1)", timestamp: "0.10s" },
      { step: 2, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-BAF321#004 (Operating Status)", timestamp: "1.15s" },
    ],
    toonOutput: "⟨MAP_START⟩⟨SRC:DB1.DBX0.1⟩⟨TGT:ECLASS:0173-1#02-BAF321#004⟩⟨CONF:0.95⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    toonMapping: {
      source: "DB1.DBX0.1",
      target: "Operating Status",
      eclassId: "0173-1#02-BAF321#004",
      action: "DirectMap",
      unit: "boolean",
    },
    confidence: 0.95,
    aasPreview: {
      idShort: "MotorOperatingStatus",
      semanticId: "0173-1#02-BAF321#004",
      valueType: "xs:boolean",
      value: "false",
      qualifiers: [{ type: "Category", valueType: "xs:string", value: "VARIABLE" }],
    },
  },
  "/temp/v1": {
    status: "warning",
    inputType: "greenfield",
    reasoningSteps: [
      { step: 1, action: "Análise de Endpoint CPS", detail: "Identificando API '/temp/v1' — REST Telemetry", timestamp: "0.08s" },
      { step: 2, action: "Guardrail Dimensional", detail: "Conversão automática parametrizada para degC (IEC 61360)", timestamp: "0.92s" },
      { step: 3, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-AAB713#005 (Temperature)", timestamp: "1.45s" },
    ],
    toonOutput: "⟨MAP_START⟩⟨SRC:/temp/v1⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.88⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    toonMapping: {
      source: "/temp/v1",
      target: "Temperature",
      eclassId: "0173-1#02-AAB713#005",
      action: "Convert_Unit",
      actionDetail: "F_to_C: (value - 32) * 5/9",
      unit: "degC",
    },
    confidence: 0.88,
    aasPreview: {
      idShort: "SensorTemperature",
      semanticId: "0173-1#02-AAB713#005",
      valueType: "xs:double",
      value: "0.0",
      qualifiers: [
        { type: "Unit", valueType: "xs:string", value: "degC" },
        { type: "ConversionFormula", valueType: "xs:string", value: "(F-32)*5/9" },
      ],
    },
  },
  "Mtr_Tmp_01": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Análise Léxica CLP", detail: "Tag 'Mtr_Tmp_01' — Sensor de Temperatura de Mancal", timestamp: "0.09s" },
      { step: 2, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-AAB713#005 (Temperature)", timestamp: "1.22s" },
    ],
    toonOutput: "⟨MAP_START⟩⟨SRC:Mtr_Tmp_01⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.90⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩",
    toonMapping: {
      source: "Mtr_Tmp_01",
      target: "Temperature",
      eclassId: "0173-1#02-AAB713#005",
      action: "DirectMap",
      unit: "degC",
    },
    confidence: 0.90,
    aasPreview: {
      idShort: "MotorBearingTemperature",
      semanticId: "0173-1#02-AAB713#005",
      valueType: "xs:double",
      value: "0.0",
      qualifiers: [{ type: "Unit", valueType: "xs:string", value: "degC" }],
    },
  },
}

function generateGenericResponse(inputData: string, inputType: "brownfield" | "greenfield"): ProcessingResult {
  return {
    status: "warning",
    inputType,
    inputData,
    reasoningSteps: [
      { step: 1, action: "Análise Léxica", detail: `Inspecionando identificador '${inputData}'...`, timestamp: "0.15s" },
      { step: 2, action: "Quantificação de Incerteza", detail: "Confiança (72%) abaixo do limiar de 85%. Encaminhado para fila HITL.", timestamp: "0.85s" },
    ],
    toonOutput: `⟨MAP_START⟩⟨SRC:${inputData}⟩⟨TGT:ECLASS:0173-1#02-BAF321#004⟩⟨CONF:0.72⟩⟨MAP_END⟩⟨ACTION:GENERATE_NODE_RED⟩`,
    toonMapping: {
      source: inputData,
      target: "Operating Status (Pending HITL)",
      eclassId: "0173-1#02-BAF321#004",
      action: "DirectMap",
      unit: "boolean",
    },
    confidence: 0.72,
    aasPreview: {
      idShort: "PendingReviewVariable",
      semanticId: "0173-1#02-BAF321#004",
      valueType: "xs:boolean",
      value: "false",
      qualifiers: [{ type: "Status", valueType: "xs:string", value: "REQUIRES_HITL_REVIEW" }],
    },
    processingTimeMs: 950,
  }
}

export function getMockResult(inputData: string, inputType: "brownfield" | "greenfield"): ProcessingResult {
  const cleanInput = inputData.trim()
  const known = KNOWN_MAPPINGS[cleanInput]

  if (known) {
    return {
      ...known,
      inputData: cleanInput,
      processingTimeMs: 850,
    }
  }

  return generateGenericResponse(cleanInput, inputType)
}

export const EXAMPLE_TAGS = [
  {
    label: "DB1.W0 — Comando Acionar Esteira (Siemens S7)",
    value: "DB1.W0",
    type: "brownfield" as const,
    description: "Comando de marcha da esteira (botão start)",
    datatype: "BOOL",
  },
  {
    label: "DB10.W2 — Velocidade Linear Esteira (Siemens S7)",
    value: "DB10.W2",
    type: "brownfield" as const,
    description: "Velocidade linear da esteira transportadora em m/s",
    datatype: "REAL",
  },
  {
    label: "Mtr_Tmp_01 — Temperatura Rolamento (Rockwell)",
    value: "Mtr_Tmp_01",
    type: "brownfield" as const,
    description: "Temperatura de rolamento do motor principal",
    datatype: "REAL",
  },
  {
    label: "%MW100 — Tag Isolada Sem Descrição (Aciona HITL < 85%)",
    value: "%MW100",
    type: "brownfield" as const,
    description: "",
    datatype: "WORD",
  },
  {
    label: "/temp/v1 — Telemetria CPS REST (Greenfield)",
    value: "/temp/v1",
    type: "greenfield" as const,
  },
]

/**
 * Generates an IDTA-01001-3-0 AAS v3.0 JSON Environment string from a ProcessingResult.
 */
export function generateAASJson(result: ProcessingResult & { aasJson?: object }): string {
  if (result.aasJson) {
    return JSON.stringify(result.aasJson, null, 2)
  }

  const env: AASEnvironmentV3 = buildIdtaAASEnvironment({
    assetId: result.inputData,
    variables: [
      {
        sourceTag: result.toonMapping.source,
        description: result.toonMapping.target,
        eclassIrdi: result.toonMapping.eclassId,
        targetName: result.toonMapping.target,
        unit: result.toonMapping.unit,
        action: result.toonMapping.action,
        actionDetail: result.toonMapping.actionDetail,
        confidence: result.confidence,
      },
    ],
  })

  return JSON.stringify(env, null, 2)
}

function nodeRedId(tag: string, suffix: string): string {
  const base = tag.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20)
  return `${base}_${suffix}`
}

/**
 * Generates an importable Node-RED flow configured with the custom
 * `semantic-plc-mapper` node and offline-resilient Edge Licensing Bridge.
 */
export function generateNodeRedFlow(
  result: ProcessingResult,
  options?: { plcVendor?: string; edgeToken?: string; platformUrl?: string }
): string {
  const tag = result.toonMapping.source
  const safeTag = tag.replace(/[^a-zA-Z0-9_]/g, "_")
  const platformUrl = (options?.platformUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
  const edgeToken = options?.edgeToken || "{{SEMANTIC_EDGE_TOKEN}}"
  const sourceTagLiteral = JSON.stringify(tag)
  const assetIdLiteral = JSON.stringify(safeTag)
  const eclassLiteral = JSON.stringify(result.toonMapping.eclassId)
  const targetLiteral = JSON.stringify(result.toonMapping.target)
  const unitLiteral = JSON.stringify(result.toonMapping.unit || "unitless")
  const platformUrlLiteral = JSON.stringify(platformUrl)
  const edgeTokenLiteral = JSON.stringify(edgeToken)
  const ids = {
    tab: nodeRedId(tag, "tab"),
    plcIn: nodeRedId(tag, "plc_in"),
    semanticNode: nodeRedId(tag, "semantic_agent_node"),
    payloadBuilder: nodeRedId(tag, "aas_api_payload"),
    aasJsonApi: nodeRedId(tag, "aas_json_api"),
    aasxApi: nodeRedId(tag, "aasx_api"),
    aasOut: nodeRedId(tag, "aas_registry"),
    localApi: nodeRedId(tag, "local_http_endpoint"),
    debug: nodeRedId(tag, "debug"),
  }

  const flow = [
    {
      id: ids.tab,
      type: "tab",
      label: `Industrial Edge — ${tag}`,
      disabled: false,
      info: "Fluxo gerado pelo Semantic Agent: PLC/IoT → AAS JSON → AASX. Substitua {{SEMANTIC_EDGE_TOKEN}} se o fluxo não foi exportado autenticado.",
    },
    {
      id: ids.plcIn,
      type: result.inputType === "brownfield" ? "s7 in" : "http request",
      z: ids.tab,
      name: `PLC Read: ${tag}`,
      x: 160,
      y: 120,
      ...(result.inputType === "brownfield"
        ? { variable: result.inputData, interval: "1000", plcVendor: options?.plcVendor || "Siemens S7-1500" }
        : { url: `http://cps-edge.local${result.inputData}`, method: "GET" }),
      wires: [[ids.semanticNode]],
    },
    {
      id: ids.semanticNode,
      type: "semantic-plc-mapper",
      z: ids.tab,
      name: `AAS/ECLASS Mapper (${result.toonMapping.eclassId})`,
      plcVendor: options?.plcVendor || "siemens-s7",
      sourceTag: result.toonMapping.source,
      eclassIrdi: result.toonMapping.eclassId,
      targetName: result.toonMapping.target,
      unit: result.toonMapping.unit || "unitless",
      actionMode: result.toonMapping.action,
      outputMode: "aas-v3-and-local-api",
      platformUrl,
      licenseToken: edgeToken,
      offlineGraceLimit: 500,
      x: 430,
      y: 120,
      wires: [[ids.payloadBuilder], [ids.debug]],
    },
    {
      id: ids.payloadBuilder,
      type: "function",
      z: ids.tab,
      name: "Build Semantic Agent API payload",
      func: `const raw = msg.payload && typeof msg.payload === "object" ? msg.payload : { value: msg.payload };\nconst body = {\n  assetId: ${assetIdLiteral},\n  sourceTag: ${sourceTagLiteral},\n  eclassIrdi: ${eclassLiteral},\n  targetName: ${targetLiteral},\n  unit: ${unitLiteral},\n  confidence: ${Number(result.confidence || 0).toFixed(4)}\n};\nconst shouldExportAasx = msg.exportAasx === true;\nmsg.semanticAgent = { sourceTag: body.sourceTag, assetId: body.assetId, rawValue: raw.value ?? raw, aasxOnDemand: true };\nconst platform = ${platformUrlLiteral};\nconst token = ${edgeTokenLiteral};\nconst jsonMsg = { ...msg, method: "POST", url: platform + "/api/aasx", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, payload: body };\nconst aasxMsg = { ...msg, method: "POST", url: platform + "/api/export-aasx", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, payload: body };\nreturn [jsonMsg, shouldExportAasx ? aasxMsg : null];`,
      outputs: 2,
      x: 670,
      y: 120,
      wires: [[ids.aasJsonApi], [ids.aasxApi]],
    },
    {
      id: ids.aasJsonApi,
      type: "http request",
      z: ids.tab,
      name: "AAS v3 JSON API",
      method: "use",
      ret: "obj",
      paytoqs: "ignore",
      url: "",
      x: 930,
      y: 90,
      wires: [[ids.aasOut]],
    },
    {
      id: ids.aasxApi,
      type: "http request",
      z: ids.tab,
      name: "AASX Package API (.aasx)",
      method: "use",
      ret: "bin",
      paytoqs: "ignore",
      url: "",
      x: 930,
      y: 170,
      wires: [[ids.debug]],
    },
    {
      id: ids.aasOut,
      type: "http request",
      z: ids.tab,
      name: "IDTA AAS v3.0 Submodel Repository",
      method: "PUT",
      url: "http://aas-registry.local:8080/shells/" + safeTag,
      x: 1190,
      y: 90,
      wires: [[ids.debug]],
    },
    {
      id: ids.debug,
      type: "debug",
      z: ids.tab,
      name: "Edge Telemetry & License Status",
      active: true,
      tosidebar: true,
      x: 1190,
      y: 220,
      wires: [],
    },
  ]
  return JSON.stringify(flow, null, 2)
}
