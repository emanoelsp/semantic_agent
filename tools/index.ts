// =============================================================================
// Tools - Schemas para Function Calling do Agente LLM
// =============================================================================
// Definições de ferramentas que o Gemini pode invocar durante o processamento.
// Utilizadas na rota /api/agent.
// =============================================================================

export const AGENT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "validate_eclass_format",
        description:
          "Valida se um código IRDI ECLASS está no formato esperado (ex: 0173-1#02-BAA123). Retorna true se válido, false caso contrário.",
        parameters: {
          type: "object",
          properties: {
            irdi_code: {
              type: "string",
              description:
                "Código IRDI ECLASS a ser validado (ex: 0173-1#02-BAA123 ou ECLASS:0173-1#02-BAA123)",
            },
          },
          required: ["irdi_code"],
        },
      },
      {
        name: "trigger_pdf_generation",
        description:
          "Aciona a geração de PDF com os dados do ativo mapeado (AAS, ECLASS, TOON). Utilizar quando o usuário solicitar exportação ou download de documentação.",
        parameters: {
          type: "object",
          properties: {
            asset_data: {
              type: "object",
              description:
                "Dados do ativo mapeado contendo source, target, eclassId, confidence",
              properties: {
                source: { type: "string", description: "Tag ou identificador de origem" },
                target: { type: "string", description: "Descrição do mapeamento ECLASS" },
                eclassId: { type: "string", description: "Código IRDI ECLASS" },
                confidence: {
                  type: "number",
                  description: "Confiança do mapeamento (0.0 a 1.0)",
                },
              },
              required: ["source", "eclassId"],
            },
          },
          required: ["asset_data"],
        },
      },
    ],
  },
]
