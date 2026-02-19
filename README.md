# TOON Semantic Agent - Agente Cognitivo para AAS

> Agente Cognitivo para Instanciacao Automatizada e Orquestracao de Asset Administration Shells (AAS) em Cenarios Industriais Hibridos via Alinhamento Semantico Restrito (TOON)

---

## Indice

1. [Visao Geral](#visao-geral)
2. [Estrategia de Construcao](#estrategia-de-construcao)
3. [Arquitetura da Solucao](#arquitetura-da-solucao)
4. [Modulos do Sistema](#modulos-do-sistema)
5. [Stack Tecnologica](#stack-tecnologica)
6. [Como Executar](#como-executar)
7. [Documentacao Detalhada](#documentacao-detalhada)

---

## Visao Geral

Este projeto implementa um MVP de um **Agente Cognitivo** baseado em LLMs que atua como **orquestrador de interoperabilidade** na Industria 4.0. O agente e capaz de:

- **Ingerir dados** de fontes legadas (Brownfield) e CPS inteligentes (Greenfield)
- **Realizar alinhamento semantico** cruzando dados com ontologias industriais (ECLASS)
- **Gerar codigo TOON** (Token-Oriented Object Notation) com validacao deterministica
- **Materializar AAS** (Asset Administration Shell) e scripts de integracao

### O Problema Central

A Industria 4.0 sofre com o **"Gargalo da Instanciacao"**: equipamentos legados possuem tags cripticas (ex: `DB1.DBX0.1`) que exigem engenharia manual intensiva para mapeamento semantico. Novos CPS expoe APIs mas com inconsistencias ontologicas. **Nao falta padrao, falta middleware cognitivo.**

### A Solucao: TOON

**TOON (Token-Oriented Object Notation)** e uma notacao intermediaria de Decodificacao Restrita que forca o LLM a gerar tokens validados por uma gramatica formal (BNF), transformando "geracao de texto" em "raciocinio simbolico estruturado". Isso garante **100% de conformidade sintatica** antes da conversao para o AAS final.

---

## Estrategia de Construcao

Este projeto foi construido seguindo uma **pipeline de 3 etapas cognitivas**, cada uma com uma ferramenta especializada. A justificativa para cada escolha esta documentada em `/docs/`.

### Etapa 1: Gemini - Escopo da Solucao (Contexto)

**Ferramenta:** Google Gemini 1.5 Pro
**Funcao:** Definicao do escopo, requisitos e contextualizacao do problema

**Por que Gemini?**
- Janela de contexto massiva (1M+ tokens) permite processar documentacao completa da Platform Industrie 4.0, IDSA e ECLASS simultaneamente
- Capacidade multimodal para analisar diagramas de arquitetura e fluxogramas industriais
- Forte em raciocinio analitico para decompor problemas complexos em requisitos funcionais
- Custo-beneficio superior para tarefas de analise e planejamento extenso

**O que foi gerado:**
- Documento de requisitos funcionais (RF-01 a RF-11)
- Especificacao dos 4 modulos do sistema (Percepcao, Raciocinio, Geracao, Atuacao)
- Framework de validacao (metricas de avaliacao)
- Definicao da gramatica TOON em BNF

> Veja detalhes em [`/docs/01-gemini-escopo.md`](/docs/01-gemini-escopo.md)

### Etapa 2: NotebookLM - Engenharia de Prompt (Tecnicas)

**Ferramenta:** Google NotebookLM
**Funcao:** Refinamento e estruturacao dos prompts usando tecnicas avancadas

**Por que NotebookLM?**
- Permite carregar multiplas fontes (papers, docs AAS, especificacoes ECLASS) como contexto persistente
- Gera insights cruzados entre fontes automaticamente
- Ideal para iterar sobre prompts com base em documentacao tecnica real
- Capacidade de sumarizacao mantendo fidelidade tecnica

**Tecnicas de Prompt Aplicadas:**
- **XML Tags Structure:** Delimitadores claros (`<contexto>`, `<tarefa>`, `<regras>`) para organizacao hierarquica
- **Chain-of-Thought (CoT):** Forcando o modelo a exibir passos de raciocinio antes da resposta
- **Few-Shot Prompting:** Exemplos concretos de entrada/saida TOON para calibrar o formato
- **Structured Outputs:** Gramatica BNF restringindo a saida para eliminar alucinacoes
- **System Prompt com Role Definition:** Papel rigido de "Especialista em Interoperabilidade Semantica"

> Veja detalhes em [`/docs/02-notebooklm-prompts.md`](/docs/02-notebooklm-prompts.md)

### Etapa 3: Agente de Codigo - Execucao de Tarefas

**Ferramenta:** v0 / Claude (Agente de Codificacao)
**Funcao:** Implementacao do sistema com planejamento e execucao estruturada

**Por que um Agente de Codigo?**
- Capacidade de analisar o codebase existente antes de implementar
- Decomposicao automatica de tarefas complexas em steps executaveis
- Geracao de codigo consistente com padroes do projeto
- Capacidade de debugging iterativo com feedback loop

**Habilidades Expostas:**
- Planejamento via TodoManager (decomposicao de milestones)
- Geracao de design com inspiracao contextual
- Leitura/escrita de arquivos com validacao
- Execucao de scripts e migrations

> Veja detalhes em [`/docs/03-agente-codigo.md`](/docs/03-agente-codigo.md)

---

## Arquitetura da Solucao

```
+------------------------------------------------------------------+
|                    TOON SEMANTIC AGENT                             |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+    +-------------------+                     |
|  | MODULO A         |    | MODULO B          |                     |
|  | Percepcao e      |--->| Raciocinio        |                     |
|  | Ingestao Hibrida |    | Semantico         |                     |
|  |                  |    |                   |                     |
|  | - Upload CSV/XML |    | - RAG + VectorDB  |                     |
|  | - API Greenfield |    | - ECLASS Lookup   |                     |
|  | - Analise Lexica |    | - CoT Reasoning   |                     |
|  +------------------+    +-------------------+                     |
|          |                        |                                |
|          v                        v                                |
|  +------------------+    +-------------------+                     |
|  | MODULO C         |    | MODULO D          |                     |
|  | Geracao TOON     |<---| Atuacao e         |                     |
|  |                  |    | Materializacao    |                     |
|  | - Grammar BNF    |    |                   |                     |
|  | - Self-Correction|    | - Export AAS JSON |                     |
|  | - Confidence     |    | - Script Node-RED |                     |
|  +------------------+    +-------------------+                     |
|                                                                    |
+------------------------------------------------------------------+
|  CAMADA DE DADOS                                                   |
|  +------------+  +------------+  +-------------+                   |
|  | Vector DB  |  | ECLASS DB  |  | AAS Registry|                   |
|  | (Qdrant)   |  | (IEC CDD)  |  | (JSON/AML)  |                   |
|  +------------+  +------------+  +-------------+                   |
+------------------------------------------------------------------+
```

### Fluxo de Dados

1. **Entrada:** Usuario envia tag PLC (Brownfield) ou endpoint API (Greenfield)
2. **Percepcao:** Modulo A realiza analise lexica e normalizacao
3. **Raciocinio:** Modulo B consulta VectorDB + ECLASS via RAG
4. **Geracao:** Modulo C produz tokens TOON validados por gramatica BNF
5. **Saida:** Modulo D converte TOON em AAS JSON e/ou scripts de integracao

### Gramatica TOON (BNF)

```bnf
<TOON>    ::= MAP{ <SOURCE> | <TARGET> | <ACTION> }
<SOURCE>  ::= SRC='<identificador_original>'
<TARGET>  ::= TGT='<eclass_irdi_ou_id_semantico>'
<ACTION>  ::= ACTION='<DirectMap | Convert_Unit | Aggregate>'
```

**Exemplo:**
```
MAP{SRC='DB10.W2' | TGT='ECLASS:0173-1#02-BAA123' | ACTION='DirectMap'}
```

---

## Modulos do Sistema

| Modulo | Nome | Funcao | Status |
|--------|------|--------|--------|
| A | Percepcao e Ingestao | Upload de dados, analise lexica | MVP (Mock) |
| B | Raciocinio Semantico | RAG, ECLASS lookup, CoT | MVP (Mock) |
| C | Geracao TOON | Parser BNF, validacao, confidence | MVP (Mock) |
| D | Atuacao | Export AAS, geracao de scripts | MVP (Mock) |

---

## Stack Tecnologica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 16 + TailwindCSS | SSR, performance, Dark Mode nativo |
| UI Components | shadcn/ui | Componentes acessiveis e temaveis |
| API | Next.js API Routes | Fullstack integrado, serverless ready |
| LLM (Futuro) | Gemini 1.5 Pro / GPT-4o | Janela de contexto + raciocinio |
| Orquestracao (Futuro) | LangGraph | Controle de estado e loops de correcao |
| Vector DB (Futuro) | Qdrant | Busca vetorial para ECLASS |
| Protocolos (Futuro) | OPC UA, MQTT, REST | Padrao industrial |

---

## Como Executar

```bash
# Instalar dependencias
pnpm install

# Executar em modo de desenvolvimento
pnpm dev

# Acessar
http://localhost:3000
```

---

## Documentacao Detalhada

- [`/docs/01-gemini-escopo.md`](./docs/01-gemini-escopo.md) - Estrategia com Gemini para escopo
- [`/docs/02-notebooklm-prompts.md`](./docs/02-notebooklm-prompts.md) - Engenharia de Prompt com NotebookLM
- [`/docs/03-agente-codigo.md`](./docs/03-agente-codigo.md) - Agente de Codigo para execucao
- [`/docs/04-thinking-process.md`](./docs/04-thinking-process.md) - Processo de Thinking do Agente
- [`/docs/05-arquitetura-solucao.md`](./docs/05-arquitetura-solucao.md) - Arquitetura detalhada da solucao

---

## Licenca

Projeto academico - Avaliacao Intermediaria de IA Aplicada.
