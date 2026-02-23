# Orquestrador Semântico Industrial

> Agente Cognitivo para Instanciação Automatizada e Orquestração de Asset Administration Shells (AAS) em Cenários Industriais Híbridos via Alinhamento Semântico Restrito (TOON)

---

## Índice

1. [Visão Geral do Orquestrador Semântico](#visão-geral-do-orquestrador-semântico)
2. [Arquitetura de LLM](#arquitetura-de-llm)
3. [Decisões de Engenharia e Justificativas](#decisões-de-engenharia-e-justificativas)
4. [Descrição das Tools Disponíveis](#descrição-das-tools-disponíveis)
5. [Arquitetura da Solução](#arquitetura-da-solução)
6. [Como Executar](#como-executar)
7. [Documentação Detalhada](#documentação-detalhada)

---

## Visão Geral do Orquestrador Semântico

O **Orquestrador Semântico Industrial** é um sistema que recebe dados descritivos de ativos industriais (textos, tags de PLC, identificadores de sensores) e produz representações padronizadas em:

- **AAS (Asset Administration Shell)** – modelo de referência para digitalização de ativos na Indústria 4.0
- **Mapeamentos ECLASS** – alinhamento ontológico com o dicionário IEC
- **Fluxos funcionais Node-RED** – integração com sistemas de automação e IoT

O sistema atua como **middleware cognitivo** entre dados legados (Brownfield) ou CPS inteligentes (Greenfield) e ecossistemas semânticos padronizados, automatizando o mapeamento que hoje exige engenharia manual intensiva.

---

## Arquitetura de LLM

O fluxo de processamento segue uma pipeline sequencial e determinística:

```
Input (Frontend) – tag/endpoint + description opcional (Brownfield)
    ↓
1. Guardrail (/api/guardrail) – Filtro de domínio industrial
    ↓ (se válido)
2. Orquestrador (/api/orchestrator) – Maestro do fluxo
    ↓
3. Agente LLM (Gemini 2.5 Flash) – Inferência em modo TOON (⟨TAG⟩⟨DESC⟩⟨DATATYPE⟩)
    ↓
4. Resposta TOON (⟨MAP_START⟩⟨SRC:...⟩⟨TGT:ECLASS:...|UNKNOWN⟩⟨CONF:0.0-1.0⟩⟨MAP_END⟩)
    ↓
5. Parser Semântico – TOON → JSON estruturado
    ↓
6. Interpretação contextual + Fallback ECLASS (se UNKNOWN ou score < 70%)
    ↓
7. Saída JSON – AAS, ECLASS, Node-RED, interpretation, eclassCandidates
```

**Alternativa Datasheet PDF:** `POST /api/extract-datasheet` – extrai variáveis via Gemini e mapeia em lote.

### Fluxo resumido

**Input enriquecido** (tag + description + datatype) → **Guardrail** → **Orquestrador** → **LLM (TOON)** → **Parser** → **Interpretação** → **JSON final**

---

## Decisões de Engenharia e Justificativas

### Escolha do Gemini 2.5 Flash

O modelo **Gemini 2.5 Flash** foi selecionado por:

- **Baixa latência** e custo otimizado para inferência semântica em produção
- **Excelente em tarefas analíticas** e raciocínio estruturado para mapeamento ontológico
- **SDK oficial `@google/genai`** com suporte a function calling e integração serverless na Vercel

### Temperatura 0.1 e Parâmetros

A temperatura foi fixada em **0.1**; `topP: 0.8`, `topK: 40`, `maxOutputTokens: 1024` para:

- **Resultados determinísticos** – reduzir variação entre execuções
- **Conformidade sintática** – o LLM deve seguir a gramática TOON com precisão
- **Evitar criatividade desnecessária** – a tarefa é mapeamento, não geração livre

**topP e topK:** Restringem o espaço de amostragem; com TOON já limitamos o vocabulário de saída, então valores moderados evitam tokens inesperados sem travar o modelo.  
**maxOutputTokens:** TOON é compacto; 1024 tokens são suficientes para o mapeamento e reduz custo de inferência.

### Por que não LangChain?

O fluxo é **controlado e previsível** (Guardrail → Orchestrator → Agent → Parser). LangChain adicionaria camadas (chains, memory, abstrações) desnecessárias. Optamos por **chamada direta ao SDK `@google/genai`** para manter controle total da engenharia de prompts e reduzir complexidade em ambiente serverless (Vercel).

### Estratégia TOON – Economia de Tokens e Redução de Alucinações

A **Token-Oriented Object Notation (TOON)** foi adotada em vez de JSON puro para:

1. **Economia de tokens** – tokens delimitados como `⟨SRC:tag⟩` são mais curtos e previsíveis que JSON aninhado
2. **Eliminação de alucinações sintáticas** – o LLM frequentemente produz JSON malformado (vírgulas extras, aspas incorretas). A notação TOON é linear e fácil de validar com regex
3. **Parsing determinístico** – a conversão TOON → JSON é feita em Node.js com regex e split, garantindo 100% de conformidade na saída estruturada
4. **Extensibilidade** – novos tokens (ex.: `⟨ACTION:GENERATE_NODE_RED⟩`) podem ser adicionados sem alterar a estrutura global

---

## Descrição das Tools Disponíveis

O agente LLM possui **function calling** habilitado com as seguintes tools:

### 1. `validate_eclass_format(irdi_code)`

Valida se um código IRDI ECLASS está no formato esperado (ex.: `0173-1#02-BAA123`).

- **Parâmetro:** `irdi_code` (string) – código a validar
- **Retorno:** `true` se válido, `false` caso contrário

### 2. `trigger_pdf_generation(asset_data)`

Aciona a geração de PDF com os dados do ativo mapeado (AAS, ECLASS, TOON).

- **Parâmetro:** `asset_data` (objeto) com `source`, `target`, `eclassId`, `confidence`
- **Uso:** quando o usuário solicita exportação ou download de documentação

---

## Arquitetura da Solução

````markdown
```mermaid
graph TD
    %% Definindo as cores e estilos
    classDef frontend fill:#333333,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#005577,stroke:#fff,stroke-width:2px,color:#fff;
    classDef llm fill:#1e8e3e,stroke:#fff,stroke-width:2px,color:#fff;
    classDef external fill:#cc0000,stroke:#fff,stroke-width:2px,color:#fff;

    %% Atores
    User((Usuário / Engenheiro))
    NodeRedExt((Node-RED /\nAplicação Externa)):::external

    %% Frontend
    subgraph "Camada de Apresentação (Vercel)"
        UI[Frontend Next.js\nsemanticagent.vercel.app]:::frontend
    end

    %% Backend
    subgraph "Camada de Negócios e Orquestração (Next.js API Routes)"
        Orchestrator{/api/orchestrator\nMaestro do Fluxo}:::backend
        Guardrail[ /api/guardrail\nFiltro de Domínio Industrial]:::backend
        AgentAPI[ /api/agent\nInterface LLM]:::backend
        Parser[ Parser Semântico\nTOON -> JSON / AAS]:::backend
        Tools[ Tools\nGerador de PDF / Validador]:::backend
    end

    %% Motor LLM
    subgraph "Camada Cognitiva"
        Gemini[Gemini 1.5 Pro\nTemp: 0.1 | Contexto: Industrial]:::llm
    end

    %% Fluxo
    User -- "1. Insere dados do Ativo (Tags)" --> UI
    UI -- "2. POST JSON" --> Orchestrator
    
    Orchestrator -- "3. Solicita Validação" --> Guardrail
    Guardrail -- "4. Retorna OK (Contexto Válido)" --> Orchestrator
    
    Orchestrator -- "5. Envia Prompt Estruturado" --> AgentAPI
    AgentAPI -- "6. Chamada API via SDK" --> Gemini
    
    Gemini -- "7. Responde notação restrita\n⟨MAP|SRC:tag|TGT:eclass⟩" --> AgentAPI
    AgentAPI -- "8. Repassa string TOON" --> Orchestrator
    
    Orchestrator -- "9. Processamento Determinístico" --> Parser
    Parser -- "10. Estrutura de Dados Limpa" --> Orchestrator
    
    Orchestrator -. "11. (Se requisitado) Aciona Tool" .-> Tools
    Tools -. "Retorna PDF gerado" .-> Orchestrator
    
    Orchestrator -- "12. Retorna AAS/Node-RED JSON" --> UI
    UI -- "13. Visualização e Download" --> User
    
    NodeRedExt -- "Consome Endpoint Diretamente\n(Trabalho Futuro)" --> Orchestrator

---

## O que funcionou

- **TOON em vez de JSON** – Eliminou erros de sintaxe (vírgulas, aspas) e reduziu tokens de saída.
- **Temperatura 0.1** – Comportamento estável e previsível; inferência semântica coerente.
- **Guardrail pré-LLM** – Bloqueia inputs fora do domínio industrial e economiza tokens.
- **Parser determinístico** – Regex/split sobre TOON garante saída JSON válida e AAS consistente.
- **Entrada enriquecida** – Tag + `description` + `datatype` para Brownfield aumenta precisão (ex.: DB1.W0 + "Comando de marcha da esteira" → ECLASS 0173-1#02-BAB014#005).
- **Regra UNKNOWN** – Variável isolada sem contexto retorna `⟨TGT:UNKNOWN⟩ ⟨CONF:0.0⟩` em vez de alucinar; Human-in-the-Loop para revisão.
- **Interpretação contextual** – Bloco "Interpretação do agente" descreve o que o LLM inferiu (variável, API, equipamento).
- **Candidatos ECLASS** – Quando score < 70%, o usuário pode escolher entre candidatos sugeridos.
- **Datasheet PDF** – Extração e mapeamento em lote via Gemini; geração de AAS multi-variável.

---

## O que não funcionou

- **JSON direto do LLM** – Quebrava com frequência (vírgulas extras, chaves abertas).
- **Temperatura > 0.3** – Gerava inconsistências e IRDIs variados para mesma tag.
- **Sem restrição de output** – O modelo às vezes justificava em texto ou saía do formato.
- **Muitos requisitos ao mesmo tempo** – O LLM não entendia todos os requisitos quando instruído de uma só vez; era necessário fracionar o escopo ou priorizar itens.
- **Modelagem aceitável no software** – O modelo tinha dificuldade em traduzir requisitos AAS/ECLASS em implementação coerente; foi preciso regras determinísticas e fallbacks para garantir conformidade.

---

## Trabalhos futuros (RAG)

- **RAG com base vetorial ECLASS** – Incorporar catálogos oficiais e submodelos AAS para grounding.
- **Grounding com templates AAS** – Reduzir alucinação em códigos IRDI e aumentar precisão.
- **Arquitetura multi-agente** – Separar módulos de geração, validação e orquestração em agentes distintos.

---

## Rotas da API

| Rota | Método | Função |
|------|--------|--------|
| `/api/guardrail` | POST | Valida se o payload está no contexto industrial. Retorna 400 se inválido. |
| `/api/agent` | POST | Interface com o Gemini 2.5 Flash. Retorna string TOON. |
| `/api/orchestrator` | POST | Fluxo completo: Guardrail → Agent → Parser → Interpretação → JSON AAS/Node-RED. Aceita `inputData`, `inputType`, `description?`, `datatype?`. |
| `/api/extract-datasheet` | POST | Upload de PDF de datasheet. Extrai variáveis via Gemini e gera multi-MAP TOON + AAS. |
| `/api/status` | GET | Retorna status da API (ex.: se GEMINI_API_KEY está configurada). |

---

## Como Executar

```bash
# Instalar dependências
pnpm install
# ou: npm install

# Configurar variável de ambiente (opcional, para modo LLM real)
# Crie .env.local com:
# GEMINI_API_KEY=sua_chave_api

# Executar em modo de desenvolvimento
pnpm dev
# ou: npm run dev

# Acessar
http://localhost:3000
```

**Modos de operação:**

- **Com `GEMINI_API_KEY`:** usa o Gemini 2.5 Flash para mapeamento semântico real (orquestrador e datasheet)
- **Sem `GEMINI_API_KEY`:** o orquestrador retorna erro 503; use `.env.local` com a chave

**Formato de entrada recomendado (Brownfield):**

```json
{
  "inputData": "DB1.W0",
  "inputType": "brownfield",
  "description": "Comando de marcha da esteira",
  "datatype": "BOOL"
}
```

Sem `description`, o agente pode retornar UNKNOWN para tags isoladas (evitando alucinação em ambientes críticos).

---

## Integração Node-RED

O Orquestrador gera fluxos Node-RED prontos para importação. Siga os passos para obter o nó e integrar ao seu flow.

### 1. Obter o JSON do fluxo

1. Na **Página 4: Modelagem Funcional**, abra a aba **Node-RED**.
2. Clique em **"Baixar JSON Node-RED"** para salvar o arquivo `.json`,  
   **ou** copie todo o conteúdo exibido na área de texto.

### 2. Importar no Node-RED

**Opção A – Via menu (recomendado)**

1. No Node-RED, abra o menu (☰) → **Import** → **Clipboard**.
2. Cole o JSON copiado.
3. Clique em **Import**.

**Opção B – Via arquivo**

1. Salve o JSON em um arquivo (ex.: `nodered-Mtr_Tmp_01.json`).
2. Menu → **Import** → **Select a file to import**.
3. Selecione o arquivo e confirme **Import**.

### 3. Integrar ao flow existente

Após importar, o fluxo aparecerá como uma nova **aba** (tab) no Node-RED.

- **Usar em flow separado:** a aba gerada já está pronta; basta clicar em **Deploy**.
- **Integrar a um flow existente:** arraste os nós para sua aba, conecte as entradas/saídas conforme necessário e faça o deploy.
- **Conectar nós externos:** ligue a saída do seu nó ao nó **"Read [tag]"** (entrada do fluxo TOON).

### 4. IDs dos nós gerados

Cada fluxo usa IDs únicos por tag para evitar conflitos:

| Nó           | Sufixo   | Função                                  |
|--------------|----------|-----------------------------------------|
| Tab          | `_tab`   | Aba do fluxo                            |
| Read [tag]   | `_inject`| Entrada (PLC/API)                       |
| TOON Transform | `_transform` | Mapeamento semântico para ECLASS |
| Publish AAS  | `_aas`   | Envio para o registry AAS               |
| Log          | `_debug` | Saída de depuração                      |

### 5. Dependências (contrib nodes)

Para **Brownfield (PLC)**: o nó de entrada usa `s7 in`. Instale o pacote:

```bash
cd ~/.node-red && npm install node-red-contrib-s7
```

Para **Greenfield (API REST)**: usa o nó nativo `http request`. Nenhuma instalação extra é necessária.

---

## Documentação Detalhada

- [`/docs/01-gemini-escopo.md`](./docs/01-gemini-escopo.md) - Estratégia com Gemini para escopo
- [`/docs/02-notebooklm-prompts.md`](./docs/02-notebooklm-prompts.md) - Engenharia de Prompt com NotebookLM
- [`/docs/03-prompt-claude-code.md`](./docs/03-prompt-claude-code.md) - Prompt final para copiar e colar no Claude Code
- [`/docs/04-agente-codigo.md`](./docs/04-agente-codigo.md) - Claude Code para execução
- [`/docs/05-thinking-process.md`](./docs/05-thinking-process.md) - Processo de Thinking do Agente
- [`/docs/06-arquitetura-solucao.md`](./docs/06-arquitetura-solucao.md) - Arquitetura detalhada da solução
- [`/docs/07-integracao-nodered.md`](./docs/07-integracao-nodered.md) - Como integrar o fluxo Node-RED ao seu flow
- [`/docs/08-avaliacao-final-checklist.md`](./docs/08-avaliacao-final-checklist.md) - Checklist da Avaliação Final

---

## Licença

Projeto acadêmico - Avaliação Final de IA Generativa.
