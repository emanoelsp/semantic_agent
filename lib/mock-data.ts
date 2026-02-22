// =============================================================================
// TOON Semantic Agent - Mock Data System
// =============================================================================
// Este arquivo contem todos os dados mockados que simulam a resposta de um LLM
// real processando tags industriais e mapeando para ECLASS via TOON.
//
// No MVP, esses mocks substituem:
// - Chamada ao Gemini/GPT-4o (inferencia semantica)
// - Consulta ao Qdrant (vector search ECLASS)
// - Validacao BNF do parser TOON
// =============================================================================

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
}

// Banco de mapeamentos conhecidos (simula o Vector DB)
const KNOWN_MAPPINGS: Record<string, Omit<ProcessingResult, "inputData" | "processingTimeMs">> = {
  "DB10.W2": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Analise Lexica", detail: "Identificando tag 'DB10.W2' - padrao Siemens S7 (Data Block 10, Word 2)", timestamp: "0.12s" },
      { step: 2, action: "Consulta Vector DB", detail: "Buscando embeddings similares no dicionario ECLASS...", timestamp: "0.45s" },
      { step: 3, action: "Inferencia Semantica", detail: "Alta probabilidade (92%) de ser 'Velocidade de Esteira Transportadora'", timestamp: "1.02s" },
      { step: 4, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-BAA123 (Velocity - linear)", timestamp: "1.34s" },
      { step: 5, action: "Validacao TOON", detail: "Token gerado e validado pela gramatica BNF. Conformidade: 100%", timestamp: "1.52s" },
    ],
    toonOutput: "MAP{SRC='DB10.W2' | TGT='ECLASS:0173-1#02-BAA123' | ACTION='DirectMap'}",
    toonMapping: {
      source: "DB10.W2",
      target: "Velocity (linear)",
      eclassId: "0173-1#02-BAA123",
      action: "DirectMap",
      unit: "m/s",
    },
    confidence: 0.92,
    aasPreview: {
      idShort: "ConveyorBeltSpeed",
      semanticId: "0173-1#02-BAA123",
      valueType: "xs:double",
      value: "dynamic",
      qualifiers: [{ type: "Unit", value: "m/s" }],
    },
  },
  "DB1.DBX0.1": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Analise Lexica", detail: "Identificando tag 'DB1.DBX0.1' - padrao Siemens S7 (Data Block 1, Bit 0.1)", timestamp: "0.10s" },
      { step: 2, action: "Consulta Vector DB", detail: "Buscando embeddings similares para tipo booleano...", timestamp: "0.38s" },
      { step: 3, action: "Inferencia Semantica", detail: "Alta probabilidade (95%) de ser 'Motor Start/Stop Control'", timestamp: "0.89s" },
      { step: 4, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-BAF321#004 (Operating Status)", timestamp: "1.15s" },
      { step: 5, action: "Validacao TOON", detail: "Token gerado e validado pela gramatica BNF. Conformidade: 100%", timestamp: "1.28s" },
    ],
    toonOutput: "MAP{SRC='DB1.DBX0.1' | TGT='ECLASS:0173-1#02-BAF321#004' | ACTION='DirectMap'}",
    toonMapping: {
      source: "DB1.DBX0.1",
      target: "Operating Status (boolean)",
      eclassId: "0173-1#02-BAF321#004",
      action: "DirectMap",
      unit: "boolean",
    },
    confidence: 0.95,
    aasPreview: {
      idShort: "MotorOperatingStatus",
      semanticId: "0173-1#02-BAF321#004",
      valueType: "xs:boolean",
      value: "dynamic",
      qualifiers: [{ type: "Category", value: "VARIABLE" }],
    },
  },
  "/temp/v1": {
    status: "warning",
    inputType: "greenfield",
    reasoningSteps: [
      { step: 1, action: "Analise de Endpoint", detail: "Identificando API '/temp/v1' - padrao REST sensor CPS", timestamp: "0.08s" },
      { step: 2, action: "Crawling AAS Nativo", detail: "CPS expoe AAS com submodelo TechnicalData...", timestamp: "0.55s" },
      { step: 3, action: "Deteccao de Conflito", detail: "ALERTA: CPS informa temperatura em Fahrenheit. Data Space exige Celsius.", timestamp: "0.92s" },
      { step: 4, action: "Resolucao de Conflito", detail: "Funcao de conversao necessaria: F_to_C = (F - 32) * 5/9", timestamp: "1.18s" },
      { step: 5, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-AAB713#005 (Temperature)", timestamp: "1.45s" },
      { step: 6, action: "Validacao TOON", detail: "Token com ACTION='Convert_Unit' validado. Conformidade: 100%", timestamp: "1.62s" },
    ],
    toonOutput: "MAP{SRC='/temp/v1' | TGT='ECLASS:0173-1#02-AAB713#005' | ACTION='Convert_Unit(F_to_C)'}",
    toonMapping: {
      source: "/temp/v1",
      target: "Temperature (Celsius)",
      eclassId: "0173-1#02-AAB713#005",
      action: "Convert_Unit",
      actionDetail: "F_to_C: (value - 32) * 5/9",
      unit: "C",
    },
    confidence: 0.88,
    aasPreview: {
      idShort: "SensorTemperature",
      semanticId: "0173-1#02-AAB713#005",
      valueType: "xs:double",
      value: "dynamic",
      qualifiers: [
        { type: "Unit", value: "degC" },
        { type: "ConversionFormula", value: "(F-32)*5/9" },
      ],
    },
  },
  "Mtr_Tmp_01": {
    status: "success",
    inputType: "brownfield",
    reasoningSteps: [
      { step: 1, action: "Analise Lexica", detail: "Identificando tag 'Mtr_Tmp_01' - nomenclatura descritiva (Motor_Temperature_01)", timestamp: "0.09s" },
      { step: 2, action: "Consulta Vector DB", detail: "Buscando embeddings para 'motor temperature sensor'...", timestamp: "0.42s" },
      { step: 3, action: "Inferencia Semantica", detail: "Alta probabilidade (90%) de ser 'Temperatura de Rolamento do Motor'", timestamp: "0.95s" },
      { step: 4, action: "Alinhamento ECLASS", detail: "Mapeado para ECLASS: 0173-1#02-AAB713#005 (Temperature)", timestamp: "1.22s" },
      { step: 5, action: "Validacao TOON", detail: "Token gerado e validado pela gramatica BNF. Conformidade: 100%", timestamp: "1.38s" },
    ],
    toonOutput: "MAP{SRC='Mtr_Tmp_01' | TGT='ECLASS:0173-1#02-AAB713#005' | ACTION='DirectMap'}",
    toonMapping: {
      source: "Mtr_Tmp_01",
      target: "Temperature (Motor Bearing)",
      eclassId: "0173-1#02-AAB713#005",
      action: "DirectMap",
      unit: "degC",
    },
    confidence: 0.90,
    aasPreview: {
      idShort: "MotorBearingTemperature",
      semanticId: "0173-1#02-AAB713#005",
      valueType: "xs:double",
      value: "dynamic",
      qualifiers: [{ type: "Unit", value: "degC" }],
    },
  },
}

// Resposta generica para tags desconhecidas
function generateGenericResponse(inputData: string, inputType: "brownfield" | "greenfield"): ProcessingResult {
  const isBrownfield = inputType === "brownfield"
  return {
    status: "warning",
    inputType,
    inputData,
    reasoningSteps: [
      { step: 1, action: "Analise Lexica", detail: `Identificando ${isBrownfield ? "tag" : "endpoint"} '${inputData}'...`, timestamp: "0.15s" },
      { step: 2, action: "Consulta Vector DB", detail: "Buscando embeddings similares no dicionario ECLASS...", timestamp: "0.58s" },
      { step: 3, action: "Inferencia Semantica", detail: `Probabilidade moderada (72%) - identificador ambiguo. Sugestao: '${inputData}' pode ser um sensor generico.`, timestamp: "1.20s" },
      { step: 4, action: "Alinhamento ECLASS", detail: "Mapeamento tentativo para ECLASS: 0173-1#02-AAA000 (Generic Sensor Value)", timestamp: "1.55s" },
      { step: 5, action: "Validacao TOON", detail: "Token gerado. ATENCAO: Confidence abaixo de 85%. Requer validacao humana.", timestamp: "1.72s" },
    ],
    toonOutput: `MAP{SRC='${inputData}' | TGT='ECLASS:0173-1#02-AAA000' | ACTION='DirectMap'}`,
    toonMapping: {
      source: inputData,
      target: "Generic Sensor Value",
      eclassId: "0173-1#02-AAA000",
      action: "DirectMap",
      unit: "unknown",
    },
    confidence: 0.72,
    aasPreview: {
      idShort: "GenericSensorValue",
      semanticId: "0173-1#02-AAA000",
      valueType: "xs:string",
      value: "dynamic",
      qualifiers: [{ type: "Status", value: "REQUIRES_HUMAN_REVIEW" }],
    },
    processingTimeMs: 1720,
  }
}

export function getMockResult(inputData: string, inputType: "brownfield" | "greenfield"): ProcessingResult {
  const cleanInput = inputData.trim()
  const known = KNOWN_MAPPINGS[cleanInput]

  if (known) {
    return {
      ...known,
      inputData: cleanInput,
      processingTimeMs: Math.floor(Math.random() * 500) + 1200,
    }
  }

  return generateGenericResponse(cleanInput, inputType)
}

// Exemplos pre-carregados para o usuario selecionar
export const EXAMPLE_TAGS = [
  { label: "DB10.W2 - Velocidade Esteira", value: "DB10.W2", type: "brownfield" as const },
  { label: "DB1.DBX0.1 - Motor Start/Stop", value: "DB1.DBX0.1", type: "brownfield" as const },
  { label: "/temp/v1 - Sensor Temperatura (API)", value: "/temp/v1", type: "greenfield" as const },
  { label: "Mtr_Tmp_01 - Temperatura Motor", value: "Mtr_Tmp_01", type: "brownfield" as const },
]

// Gerar AAS JSON completo para exportacao
export function generateAASJson(result: ProcessingResult): string {
  const aas = {
    assetAdministrationShells: [{
      idShort: "GeneratedAAS",
      id: `urn:aas:${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}`,
      assetInformation: {
        assetKind: "Instance",
        globalAssetId: `urn:asset:${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}`,
      },
      submodels: [{ keys: [{ type: "Submodel", value: "TechnicalData" }] }],
    }],
    submodels: [{
      idShort: "TechnicalData",
      id: `urn:submodel:technical:${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}`,
      semanticId: { keys: [{ type: "GlobalReference", value: "0173-1#01-AFZ615#016" }] },
      submodelElements: [{
        modelType: "Property",
        ...result.aasPreview,
      }],
    }],
    conceptDescriptions: [{
      idShort: result.toonMapping.target,
      id: `urn:eclass:${result.toonMapping.eclassId}`,
      embeddedDataSpecifications: [{
        dataSpecification: { keys: [{ type: "GlobalReference", value: "DataSpecificationIEC61360" }] },
        dataSpecificationContent: {
          preferredName: [{ language: "en", text: result.toonMapping.target }],
          unit: result.toonMapping.unit,
          sourceOfDefinition: "ECLASS",
        },
      }],
    }],
  }
  return JSON.stringify(aas, null, 2)
}

// Gerar script Node-RED para exportacao (formato importavel)
// IDs unicos por tag para permitir integracao em flows existentes
function nodeRedId(tag: string, suffix: string): string {
  const base = tag.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20)
  return `${base}_${suffix}`
}

export function generateNodeRedFlow(result: ProcessingResult): string {
  const tag = result.toonMapping.source
  const ids = {
    tab: nodeRedId(tag, "tab"),
    inject: nodeRedId(tag, "inject"),
    transform: nodeRedId(tag, "transform"),
    aas: nodeRedId(tag, "aas"),
    debug: nodeRedId(tag, "debug"),
  }

  const flow = [
    {
      id: ids.tab,
      type: "tab",
      label: `TOON - ${tag}`,
      x: 10,
      y: 10,
    },
    {
      id: ids.inject,
      type: result.inputType === "brownfield" ? "s7 in" : "http request",
      name: `Read ${tag}`,
      tab: ids.tab,
      x: 150,
      y: 100,
      ...(result.inputType === "brownfield"
        ? { variable: result.inputData, interval: "1000" }
        : { url: `http://cps-device${result.inputData}`, method: "GET" }),
      wires: [[ids.transform]],
    },
    {
      id: ids.transform,
      type: "function",
      name: "TOON Transform",
      tab: ids.tab,
      x: 380,
      y: 100,
      func: result.toonMapping.action === "Convert_Unit"
        ? `// Conversao: ${result.toonMapping.actionDetail}\nmsg.payload = (msg.payload - 32) * 5/9;\nmsg.semanticId = "${result.toonMapping.eclassId}";\nmsg.unit = "${result.toonMapping.unit}";\nreturn msg;`
        : `// ${result.toonMapping.source} -> ${result.toonMapping.target}\nmsg.semanticId = "${result.toonMapping.eclassId}";\nmsg.unit = "${result.toonMapping.unit}";\nreturn msg;`,
      wires: [[ids.aas]],
    },
    {
      id: ids.aas,
      type: "http request",
      name: "Publish AAS",
      tab: ids.tab,
      x: 610,
      y: 100,
      url: "http://aas-registry:8080/api/v1/submodels/TechnicalData/elements",
      method: "PUT",
      wires: [[ids.debug]],
    },
    {
      id: ids.debug,
      type: "debug",
      name: "Log",
      tab: ids.tab,
      x: 840,
      y: 100,
    },
  ]
  return JSON.stringify(flow, null, 2)
}
