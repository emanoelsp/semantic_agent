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
|  | [Input Tag Manual]        |  | [ECLASS Match Display]   |               |
|  | [Toggle Brownfield/Green] |  | [Confidence Gauge]       |               |
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
|  POST /api/process-ingestion                                                |
|  |                                                                          |
|  |-> Recebe: { type: "brownfield"|"greenfield", data: string|File }        |
|  |-> Processa: Mock com delay simulando LLM                                |
|  |-> Retorna: { reasoning_steps, toon_output, confidence, aas_preview }    |
|                                                                             |
|  GET /api/eclass-lookup                                                     |
|  |                                                                          |
|  |-> Recebe: { query: string }                                             |
|  |-> Retorna: { matches: EclassProperty[] }                                |
|                                                                             |
+============================================================================+
                                    |
                                    | (Futuro: LLM API + VectorDB)
                                    v
+============================================================================+
|                          CAMADA DE INTELIGENCIA (FUTURO)                    |
|                                                                             |
|  +------------------+  +------------------+  +------------------+           |
|  | LLM Engine       |  | RAG Pipeline     |  | TOON Parser      |           |
|  | (Gemini/GPT-4o)  |  | (LangGraph)      |  | (BNF Validator)  |           |
|  |                  |  |                  |  |                  |           |
|  | - Inferencia     |  | - Embedding      |  | - Tokenizacao    |           |
|  | - CoT Reasoning  |  | - Retrieval      |  | - Validacao      |           |
|  | - Few-Shot       |  | - Re-ranking     |  | - Self-Correct   |           |
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

### Principio 2: Mock-First Development

A arquitetura foi desenhada para ser **mock-first**:

```
[MVP Atual]                    [Projeto Final]
Mock Handler     ------->      LLM API + RAG
Mock Data        ------->      Vector DB + ECLASS
Static Response  ------->      Dynamic Inference
```

**Beneficio:** A interface e a API estao prontas. Basta substituir os mocks por implementacoes reais.

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
│   ├── layout.tsx              # Layout root com tema dark
│   ├── page.tsx                # Dashboard principal
│   ├── globals.css             # Tokens de design (dark industrial)
│   └── api/
│       └── process-ingestion/
│           └── route.ts        # Mock endpoint principal
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── dashboard-header.tsx    # Header do dashboard
│   ├── module-ingestion.tsx    # Modulo A
│   ├── module-reasoning.tsx    # Modulo B
│   ├── module-toon.tsx         # Modulo C
│   └── module-actuation.tsx    # Modulo D
├── lib/
│   ├── utils.ts                # Utilidades gerais
│   ├── mock-data.ts            # Dados mock realistas
│   └── toon-parser.ts          # Parser/validator TOON
├── docs/
│   ├── 01-gemini-escopo.md
│   ├── 02-notebooklm-prompts.md
│   ├── 03-prompt-claude-code.md
│   ├── 04-agente-codigo.md
│   ├── 05-thinking-process.md
│   └── 06-arquitetura-solucao.md
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
| MVP (Atual) | Dashboard + Mocks + Documentacao | Em desenvolvimento |
| v1.0 | Integracao Gemini/GPT-4o real | Planejado |
| v1.5 | RAG com Qdrant + ECLASS | Planejado |
| v2.0 | Self-Correction loop + Human-in-the-Loop | Planejado |
| v3.0 | Edge deployment com OPC UA/MQTT | Futuro |
