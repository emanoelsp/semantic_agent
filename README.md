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
Input (Frontend)
    ↓
1. Guardrail (/api/guardrail) – Filtro de domínio industrial
    ↓ (se válido)
2. Orquestrador (/api/orchestrator) – Maestro do fluxo
    ↓
3. Agente LLM (/api/agent) – Gemini 1.5 Pro em modo TOON
    ↓
4. Resposta TOON (string com tokens ⟨MAP_START⟩⟨SRC:...⟩⟨TGT:...⟩⟨CONF:...⟩⟨MAP_END⟩)
    ↓
5. Parser Semântico – Regex/split convertendo TOON → JSON estruturado
    ↓
6. Saída JSON – AAS, ECLASS, Node-RED para o frontend
```

### Fluxo resumido

**Input** → **Guardrail** (validação heurística) → **Orquestrador** → **LLM (TOON)** → **Parser** → **JSON final**

---

## Decisões de Engenharia e Justificativas

### Escolha do Gemini 1.5 Pro

O modelo **Gemini 1.5 Pro** foi selecionado por:

- **Janela de contexto ampla** (até 1M+ tokens), permitindo carregar documentação AAS/ECLASS como contexto quando necessário
- **Excelente em tarefas analíticas** e raciocínio estruturado para mapeamento ontológico
- **Custo-benefício** favorável para workloads de inferência semântica
- **SDK oficial `@google/genai`** com suporte a function calling e integração serverless na Vercel

### Temperatura 0.1

A temperatura foi fixada em **0.1** (assim como `topP: 0.8`) para:

- **Resultados determinísticos** – reduzir variação entre execuções
- **Conformidade sintática** – o LLM deve seguir a gramática TOON com precisão
- **Evitar criatividade desnecessária** – a tarefa é mapeamento, não geração livre

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
```

---

## Rotas da API

| Rota | Método | Função |
|------|--------|--------|
| `/api/guardrail` | POST | Valida se o payload está no contexto industrial. Retorna 400 se inválido. |
| `/api/agent` | POST | Interface com o Gemini Pro. Retorna string TOON. |
| `/api/orchestrator` | POST | Fluxo completo: Guardrail → Agent → Parser → JSON AAS/Node-RED. |

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

- **Com `GEMINI_API_KEY`:** usa o Gemini 2.5 Flash para mapeamento semântico real
- **Sem `GEMINI_API_KEY`:** usa mapeamentos mock pré-definidos (funcional para testes)

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

---

## Licença

Projeto acadêmico - Avaliação Final de IA Generativa.
