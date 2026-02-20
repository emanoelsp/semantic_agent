# TOON Semantic Agent - Agente Cognitivo para AAS

> Agente Cognitivo para Instanciação Automatizada e Orquestração de Asset Administration Shells (AAS) em Cenários Industriais Híbridos via Alinhamento Semântico Restrito (TOON)

---

## Índice

1. [Visao Geral](#visao-geral)
2. [Estratégia de Construção](#estratégia-de-construção)
3. [Arquitetura da Solucao](#arquitetura-da-solucao)
4. [Modulos do Sistema](#modulos-do-sistema)
5. [Stack Tecnologica](#stack-tecnologica)
6. [Como Executar](#como-executar)
7. [Documentacao Detalhada](#documentacao-detalhada)

---

## Visão Geral

Este projeto implementa um MVP de um **Agente Cognitivo** baseado em LLMs que atua como **orquestrador de interoperabilidade** na Indústria 4.0. O agente é capaz de:

- **Ingerir dados** de fontes legadas (Brownfield) e CPS inteligentes (Greenfield)
- **Realizar alinhamento semântico** cruzando dados com ontologias industriais (ECLASS)
- **Gerar código TOON** (Token-Oriented Object Notation) com validação determinística
- **Materializar AAS** (Asset Administration Shell) e scripts de integração

### O Problema Central

A Indústria 4.0 sofre com o **"Gargalo da Instanciação"**: equipamentos legados possuem tags criptográficas (ex: `DB1.DBX0.1`) que exigem engenharia manual intensiva para mapeamento semântico. Novos CPS expõem APIs mas com inconsistências ontológicas. **Não falta padrão, falta middleware cognitivo.**

### A Solucao: TOON

**TOON (Token-Oriented Object Notation)** é uma notação intermediária de Decodificação Restrita que força o LLM a gerar tokens validados por uma gramática formal (BNF), transformando "geração de texto" em "raciocínio simbólico estruturado". Isso garante **100% de conformidade sintática** antes da conversão para o AAS final.

---

## Estratégia de Construção

Este projeto foi construído seguindo uma **pipeline de 3 etapas cognitivas**, cada uma com uma ferramenta especializada. A justificativa para cada escolha está documentada em `/docs/`.

### Etapa 1: Gemini - Escopo da Solucao (Contexto)

**Ferramenta:** Google Gemini 1.5 Pro
**Função:** Definição do escopo, requisitos e contextualização do problema

**Por que Gemini?**
- Janela de contexto massiva (1M+ tokens) permite processar documentação completa da Platform Industrie 4.0, IDSA e ECLASS simultaneamente
- Capacidade multimodal para analisar diagramas de arquitetura e fluxogramas industriais
- Forte em raciocínio analítico para decompor problemas complexos em requisitos funcionais
- Custo-beneficio superior para tarefas de analise e planejamento extenso

**O que foi gerado:**
- Documento de requisitos funcionais (RF-01 a RF-11)
- Especificação dos 4 módulos do sistema (Percepção, Raciocínio, Geração, Atuação)
- Framework de validação (métricas de avaliação)
- Definição da gramática TOON em BNF

> Veja detalhes em [`/docs/01-gemini-escopo.md`](/docs/01-gemini-escopo.md)

### Etapa 2: NotebookLM - Engenharia de Prompt (Tecnicas)

**Ferramenta:** Google NotebookLM
**Função:** Refinamento e estruturação dos prompts usando técnicas avançadas

**Por que NotebookLM?**
- Permite carregar múltiplas fontes (papers, docs AAS, especificações ECLASS) como contexto persistente
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

### Etapa 3: Agente de Código - Execução de Tarefas

**Ferramenta:** Claude Code (agente de codificação IA da Anthropic)
**Função:** Implementação do sistema com planejamento e execução estruturada. O prompt original tinha como objetivo registrar o "thing" (ATO) e criar o README e a documentação em `/docs/`.

**Por que Claude Code?**
- Capacidade de analisar o codebase existente antes de implementar
- Decomposição automática de tarefas complexas em steps executáveis
- Geração de código consistente com padrões do projeto
- Capacidade de debugging iterativo com feedback loop

**Habilidades Expostas:**
- Planejamento via TodoManager (decomposicao de milestones)
- Geracao de design com inspiracao contextual
- Leitura/escrita de arquivos com validacao
- Execucao de scripts e migrations

> Veja detalhes em [`/docs/04-agente-codigo.md`](/docs/04-agente-codigo.md)

---

## Arquitetura da Solução

```
+------------------------------------------------------------------+
|                    TOON SEMANTIC AGENT                             |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+    +-------------------+                     |
|  | MODULO A         |    | MODULO B          |                     |
|  | Percepção e      |--->| Raciocínio        |                     |
|  | Ingestão Híbrida |    | Semântico         |                     |
|  |                  |    |                   |                     |
|  | - Upload CSV/XML |    | - RAG + VectorDB  |                     |
|  | - API Greenfield |    | - ECLASS Lookup   |                     |
|  | - Analise Lexica |    | - CoT Reasoning   |                     |
|  +------------------+    +-------------------+                     |
|          |                        |                                |
|          v                        v                                |
|  +------------------+    +-------------------+                     |
|  | MODULO C         |    | MODULO D          |                     |
|  | Geração TOON     |<---| Atuação e         |                     |
|  |                  |    | Materialização    |                     |
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
2. **Percepção:** Módulo A realiza análise léxica e normalização
3. **Raciocínio:** Módulo B consulta VectorDB + ECLASS via RAG
4. **Geração:** Módulo C produz tokens TOON validados por gramática BNF
5. **Saída:** Módulo D converte TOON em AAS JSON e/ou scripts de integração

### Gramática TOON (BNF)

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

| Módulo | Nome | Função | Status |
|--------|------|--------|--------|
| A | Percepção e Ingestão | Upload de dados, análise léxica | MVP (Mock) |
| B | Raciocínio Semântico | RAG, ECLASS lookup, CoT | MVP (Mock) |
| C | Geração TOON | Parser BNF, validação, confidence | MVP (Mock) |
| D | Atuação | Export AAS, geração de scripts | MVP (Mock) |

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 16 + TailwindCSS | SSR, performance, Dark Mode nativo |
| UI Components | shadcn/ui | Componentes acessiveis e temaveis |
| API | Next.js API Routes | Fullstack integrado, serverless ready |
| LLM (Futuro) | Gemini 1.5 Pro / GPT-4o | Janela de contexto + raciocinio |
| Orquestração (Futuro) | LangGraph | Controle de estado e loops de correção |
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

## Documentação Detalhada

- [`/docs/01-gemini-escopo.md`](./docs/01-gemini-escopo.md) - Estratégia com Gemini para escopo
- [`/docs/02-notebooklm-prompts.md`](./docs/02-notebooklm-prompts.md) - Engenharia de Prompt com NotebookLM
- [`/docs/03-prompt-claude-code.md`](./docs/03-prompt-claude-code.md) - Prompt final para copiar e colar no Claude Code
- [`/docs/04-agente-codigo.md`](./docs/04-agente-codigo.md) - Claude Code para execução
- [`/docs/05-thinking-process.md`](./docs/05-thinking-process.md) - Processo de Thinking do Agente
- [`/docs/06-arquitetura-solucao.md`](./docs/06-arquitetura-solucao.md) - Arquitetura detalhada da solução

---

## Licença

Projeto acadêmico - Avaliação Intermediária de IA Aplicada.
