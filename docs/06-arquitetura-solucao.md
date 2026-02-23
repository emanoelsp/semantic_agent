# Arquitetura Detalhada da Solucao

## Visao Geral da Arquitetura - Semantic Agent AAS

A arquitetura do TOON Semantic Agent segue o padrao **Modular Pipeline** com 4 estagios de processamento, inspirado em arquiteturas de controle industrial (Sense -> Think -> Decide -> Act).

---

## Diagrama de Arquitetura Completo

```
+============================================================================+
|                          CAMADA DE APRESENTACAO                             |
|                          (Next.js 16 + TailwindCSS)                         |
|                                                                             |
|  +---------------------------+  +---------------------------+               |
|  | MODULO A                  |  | MODULO B                  |               |
|  | Percepcao & Ingestao      |  | Raciocinio Semantico      |               |
|  |                           |  |                           |               |
|  | [Upload CSV/XML]          |  | [Log de Raciocinio CoT]  |               |
|  | [Input Tag + Description] |  | [Interpretação do Agente] |               |
|  | [Toggle Brownfield/Green] |  | [ECLASS Match / Candidatos] |               |
|  +---------------------------+  +---------------------------+               |
|                                                                             |
|  +---------------------------+  +---------------------------+               |
|  | MODULO C                  |  | MODULO D                  |               |
|  | Geracao TOON              |  | Atuacao & Export          |               |
|  |                           |  |                           |               |
|  | [TOON Code Display]       |  | [Btn: Export AAS JSON]   |               |
|  | [BNF Validation Status]   |  | [Btn: Gerar Node-RED]    |               |
|  | [Syntax Highlighting]     |  | [Btn: Download Script]   |               |
|  +---------------------------+  +---------------------------+               |
|                                                                             |
+============================================================================+
                                    |
                                    | HTTP POST/GET
                                    v
+============================================================================+
|                          CAMADA DE API                                       |
|                          (Next.js API Routes)                                |
|                                                                             |
|  POST /api/orchestrator (inputData, inputType, description?, datatype?)     |
|  |-> Fluxo: Guardrail -> Agent (Gemini) -> Parser -> Interpretação          |
|  |-> Retorna: reasoningSteps, confidence, interpretation, eclassCandidates |
|                                                                             |
|  POST /api/extract-datasheet (FormData PDF) -> multi-MAP TOON + AAS        |
|                                                                             |
+============================================================================+
                                    |
                                    v
+============================================================================+
|                          CAMADA DE INTELIGENCIA                             |
|                                                                             |
|  +------------------+  +------------------+  +------------------+           |
|  | LLM (Gemini 2.5) |  | ECLASS Fallback  |  | TOON Parser      |           |
|  |                  |  |                  |  |                  |           |
|  | - Inferência     |  | - UNKNOWN→heur.  |  | - Tokenização    |           |
|  | - Input TOON     |  | - Candidatos     |  | - Validação      |           |
|  | ⟨TAG⟩⟨DESC⟩      |  | score < 70%      |  | - BNF conform.   |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                             |
+============================================================================+
                                    |
                                    v
+============================================================================+
|                          CAMADA DE DADOS (FUTURO)                           |
|                                                                             |
|  +------------------+  +------------------+  +------------------+           |
|  | Vector DB        |  | Graph DB         |  | AAS Registry     |           |
|  | (Qdrant)         |  | (Neo4j)          |  | (JSON/AML Store) |           |
|  |                  |  |                  |  |                  |           |
|  | - ECLASS Embeds  |  | - Asset Relations|  | - AAS Instances  |           |
|  | - IEC CDD        |  | - Submodel Links |  | - Versions       |           |
|  | - Platform I4.0  |  | - Capabilities   |  | - Export Queue    |           |
|  +------------------+  +------------------+  +------------------+           |
|                                                                             |
+============================================================================+
```

---

## Por que Esta Arquitetura?

### Principio 1: Separacao de Responsabilidades

Cada modulo tem uma **responsabilidade unica**:

- **Modulo A (Percepcao):** So se preocupa em normalizar a ENTRADA
- **Modulo B (Raciocinio):** So se preocupa em ENTENDER semanticamente
- **Modulo C (Geracao):** So se preocupa em PRODUZIR TOON valido
- **Modulo D (Atuacao):** So se preocupa em MATERIALIZAR a saida

**Beneficio:** Cada modulo pode ser testado, evoluido e substituido independentemente.

### Principio 2: Entrada Enriquecida (Brownfield)

Para variáveis isoladas de PLC/sensor legado, o mapeamento exige **contexto semântico**:

```
[Envio incorreto]              [Envio correto]
{"tag": "DB1.W0"}      --->    {"tag": "DB1.W0", "description": "Comando de marcha da esteira", "datatype": "BOOL"}
```

**Benefício:** Sem description, o agente retorna `⟨TGT:UNKNOWN⟩ ⟨CONF:0.0⟩` em vez de alucinar. Human-in-the-Loop para ambientes críticos.

### Principio 3: Pipeline Linear com Feedback

O fluxo e linear (A -> B -> C -> D) mas com **feedback loop** no Modulo C:

```
[Geracao TOON] -> [Validacao BNF] -> OK? -> [Modulo D]
                                  -> FAIL? -> [Self-Correction] -> [Re-Geracao]
```

**Beneficio:** Garante 100% de conformidade sintatica antes da materializacao.

---

## Decisoes Tecnicas e Justificativas

### Next.js vs. FastAPI Separado

| Criterio | Next.js Full-Stack | FastAPI + React |
|----------|-------------------|-----------------|
| Complexidade de deploy | 1 servico | 2 servicos |
| Comunicacao | Import direto | HTTP cross-origin |
| Type safety | TypeScript end-to-end | Python + TypeScript |
| Serverless | Nativo Vercel | Requer config extra |

**Decisao:** Next.js full-stack. Para um MVP academico, a simplicidade de deploy e critica.

### API Routes vs. Server Actions

| Criterio | API Routes | Server Actions |
|----------|-----------|----------------|
| Reusabilidade | Alta (qualquer client) | Baixa (React only) |
| Testabilidade | curl/Postman | Browser only |
| Documentacao | REST padrao | Next.js especifico |

**Decisao:** API Routes. Permitem testes independentes e documentacao REST padrao.

### Mocks com Delay vs. Dados Estaticos

| Criterio | Mock + Delay | Dados Estaticos |
|----------|-------------|-----------------|
| Realismo UX | Alto | Baixo |
| Teste de loading states | Sim | Nao |
| Preparacao para LLM real | Sim | Nao |

**Decisao:** Mocks com delay de 2s. Simula a latencia real de uma chamada LLM e permite validar loading states.

---

## Estrutura de Diretorio

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── agente/page.tsx         # Página principal do agente (4 módulos)
│   ├── globals.css
│   └── api/
│       ├── orchestrator/       # Fluxo principal (Guardrail → Agent → Parser)
│       ├── extract-datasheet/  # Datasheet PDF → multi-MAP TOON + AAS
│       ├── agent/              # Interface LLM (Gemini)
│       ├── guardrail/          # Filtro domínio industrial
│       ├── status/             # Status da API (GEMINI_API_KEY)
│       └── process-ingestion/  # Mock legado (compatibilidade)
├── components/
│   ├── module-ingestion.tsx    # Input tag + description + datasheet upload
│   ├── module-reasoning.tsx    # Steps, interpretation, confidence, eclassCandidates
│   ├── module-toon.tsx         # TOON display
│   └── module-modelagem.tsx    # AAS + Node-RED
├── lib/
│   ├── agent.ts                # invokeAgent, inputToToon (⟨TAG⟩⟨DESC⟩⟨DATATYPE⟩)
│   ├── guardrail.ts
│   ├── interpretation.ts       # getInterpretation (contexto variável/API/equipamento)
│   ├── eclass-fallback.ts      # UNKNOWN fallback, getEclassCandidates
│   ├── toon-orchestrator-parser.ts
│   ├── datasheet-agent.ts      # Extração PDF + mapeamento
│   └── aas-datasheet.ts        # Geração AAS multi-variável
├── prompts/
│   ├── system_prompt.txt       # Regra UNKNOWN, ECLASS 0173-1#02-BAB014#005
│   └── few_shot_examples.txt
├── tools/                      # validate_eclass_format, trigger_pdf_generation
├── docs/
└── README.md
```

---

## Metricas de Validacao (Futuro)

| Metrica | Alvo | Como Medir |
|---------|------|-----------|
| Semantic Accuracy | > 85% | Agent vs. Human Ground Truth |
| Syntactic Robustness | 100% | TOON parse success rate |
| Integration Time | -70% | Manual vs. Agent-assisted |
| Confidence Calibration | r > 0.8 | Score vs. actual accuracy |

---

## Fluxo de Publicação (Claude Code → v0.dev)

1. **Claude Code** gera o projeto e disponibiliza download em ZIP
2. **Upload no v0.dev** — agente interligado com Vercel e GitHub
3. **Solicitar ao v0.dev** criação das páginas iniciais e de explicação
4. **Commit no GitHub e publicação na Vercel** — realizados automaticamente pelo v0.dev

---

## Roadmap

| Fase | Descricao | Status |
|------|-----------|--------|
| v1.0 | Integracao Gemini 2.5 Flash real | Concluído |
| v1.1 | Entrada enriquecida (description, datatype) | Concluído |
| v1.2 | Regra UNKNOWN + Human-in-the-Loop | Concluído |
| v1.3 | Interpretação contextual + Candidatos ECLASS | Concluído |
| v1.4 | Datasheet PDF (extração + multi-MAP) | Concluído |
| v2.0 | RAG com Qdrant + ECLASS | Planejado |
| v3.0 | Edge deployment com OPC UA/MQTT | Futuro |
