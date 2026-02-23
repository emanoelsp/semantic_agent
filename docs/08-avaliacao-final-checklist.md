# Checklist Avaliação Final — IA Generativa

> Critérios de avaliação e alinhamento com o Orquestrador Semântico Industrial.

---

## Resumo da Pontuação

| Critério | Pontos | Status |
|----------|--------|--------|
| System prompt e estratégia de prompting | 18 | ✓ |
| Ferramentas (tools) e integração | 14 | ✓ |
| Escolha e configuração de parâmetros | 10 | ✓ |
| Arquitetura e escolha de framework | 10 | ✓ |
| README e documentação | 10 | ✓ |
| Apresentação oral e respostas | 8 | — |
| **Total** | **70** | |

---

## 1. System Prompt e Estratégia de Prompting (18 pts)

**Localização:** `prompts/system_prompt.txt`, `prompts/few_shot_examples.txt`

- [x] Persona clara (Agente Cognitivo Industrial)
- [x] Restrições explícitas (UNKNOWN quando tag isolada sem contexto; formato TOON rígido)
- [x] Formato de saída especificado (gramática TOON com ⟨MAP_START⟩...⟨MAP_END⟩)
- [x] Técnica de prompting: few-shot implícito no prompt
- [x] XML/tokens estruturados para delimitar saída

---

## 2. Ferramentas (Tools) e Integração (14 pts)

**Localização:** `tools/index.ts`, integração em `lib/agent.ts` e APIs

- [x] `validate_eclass_format(irdi_code)` — validação de IRDI ECLASS
- [x] `trigger_pdf_generation(asset_data)` — geração de PDF
- [x] Descrições claras para o modelo
- [x] Integração coerente com fluxo (orchestrator → agent → tools)

**Justificativa:** Separação de responsabilidades evita que o LLM valide sua própria saída; validação determinística em Node.js garante consistência.

---

## 3. Parâmetros (10 pts)

| Parâmetro | Valor | Justificativa |
|-----------|-------|---------------|
| model | gemini-2.5-flash / gemini-1.5-pro | Custo e qualidade para mapeamento semântico |
| temperature | 0.1 | Determinação; mapeamento não é criativo |
| topP | 0.8 | Restringe amostragem sem travar o modelo |
| topK | 40 | Vocabulário controlado de saída |
| maxOutputTokens | 1024 | TOON compacto; economia de custo |

---

## 4. Arquitetura e Framework (10 pts)

- **Framework:** Chamada direta à API (SDK `@google/genai`), sem LangChain.
- **Justificativa:** Fluxo controlado (Guardrail → Orchestrator → Agent → Parser). LangChain adicionaria complexidade desnecessária em ambiente serverless.
- **Arquitetura:** Pipeline sequencial determinística com camadas separadas.

---

## 5. README (10 pts)

- [x] Descrição do problema e da solução
- [x] Arquitetura de LLM (fluxo Input → Guardrail → LLM → Parser → JSON)
- [x] Decisões e justificativas (modelo, parâmetros, TOON, tools)
- [x] O que funcionou
- [x] O que não funcionou
- [x] Trabalhos futuros (RAG)

---

## 6. Apresentação Oral (8 pts)

**Dicas:**

- Abra com: "Orquestrador Semântico baseado em LLM que recebe descrições de ativos industriais e gera AAS/ECLASS e Node-RED."
- Foque em decisões de LLM (2min): modelo, parâmetros, TOON, tools, por que não LangChain.
- Ensaie respostas para: temperatura, input malicioso, RAG, formato TOON vs JSON.

---

## Estrutura do Repositório

```
├── README.md
├── prompts/
│   ├── system_prompt.txt      # Regra UNKNOWN, ECLASS BAB014#005, ⟨DESC⟩⟨DATATYPE⟩
│   └── few_shot_examples.txt
├── tools/
│   └── index.ts
├── app/
│   ├── api/
│   │   ├── guardrail/
│   │   ├── agent/
│   │   ├── orchestrator/      # Aceita description, datatype
│   │   ├── extract-datasheet/ # PDF datasheet → multi-MAP
│   │   └── status/
│   ├── agente/                # 4 módulos + interpretation, eclassCandidates
│   ├── estrategia/
│   └── portfolio/
├── lib/
│   ├── agent.ts               # inputToToon com ⟨DESC⟩⟨DATATYPE⟩
│   ├── guardrail.ts
│   ├── interpretation.ts      # getInterpretation (variável/API/equipamento)
│   ├── eclass-fallback.ts     # getEclassCandidates, applyEclassFallback
│   └── toon-orchestrator-parser.ts
└── docs/
```
