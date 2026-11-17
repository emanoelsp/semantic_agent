# Semantic Agent

Da tag cega à inteligência industrial. Processamento sintático, semântico e
cognitivo para CLPs, IoT e AAS.

SaaS/API para mapear variáveis industriais para ECLASS e IDTA AAS, com Gemini,
RAG Pinecone, Firebase, cobrança por créditos e integração Node-RED.

## Desenvolvimento

```bash
cp .env.example .env.local
npm install
npm run typecheck
npm run dev
```

Em desenvolvimento o fallback demo fica habilitado por padrão. Em produção ele
é sempre desabilitado; configure `GEMINI_API_KEY`, Firebase, `SESSION_SECRET` e
Mercado Pago. Para habilitar RAG, configure também `PINECONE_API_KEY`,
`PINECONE_INDEX_HOST`, `PINECONE_NAMESPACE` e a dimensão do embedding.

Antes do deploy, execute `npm run typecheck && npm run build`.

## O que fica em cada projeto

```
CLAUDE.md                  → só o que é específico deste projeto (vence o global)
docs/PRD.md                → objetivo, público, requisitos
docs/ARCHITECTURE.md       → stack REAL, estrutura, decisões técnicas
docs/TASKS.md              → backlog / em andamento / concluído
.cursor/rules/project.mdc  → regras para o Cursor (ele não lê ~/.claude)
.env.example
```

Para começar um projeto novo: abra o Claude Code na pasta e rode `/init-project`
(cria os 3 docs e o CLAUDE.md preenchidos com suas respostas). Ou copie esta pasta.

## O que vem do global (`~/.claude/`)

| Tipo | Itens | Como usar |
|------|-------|-----------|
| Regras | `CLAUDE.md` — fluxo, Worker-Reviewer, UI, segurança Firebase | automático |
| Skills | `design-engineering`, `document-extraction`, `test-strategy`, `ai-agent-architecture`, `deslop`, `zod-validation-expert`, `tanstack-query-expert`, `rag-engineer`, `llm-evaluation` | carregam pela descrição; ou "use a skill X" |
| Agentes | `ui-designer`, `debugger`, `firebase-security-auditor` | "use o agente X" (rodam em contexto separado) |
| Comandos | `/init-project`, `/workflow`, `/task`, `/active-learning` | digite `/nome` |

Um projeto pode **especializar** qualquer item criando um com o mesmo nome em
`.claude/skills|agents|commands` do repo (ex.: o magistra tem um `document-extraction`
próprio para templates de escola).

Os docs que antes eram copiados (AGENTS, DESIGN, TESTING, DEPLOY, AI_AGENT,
DOCUMENT_EXTRACTION) viraram as skills acima. Se um projeto precisar de regra
própria de design ou testes, crie `docs/DESIGN.md` / `docs/TESTING.md` nele — as
skills leem o doc do projeto primeiro.

## Stack padrão

Next.js (App Router) + TypeScript estrito · Tailwind · Firebase Auth + Firestore ·
Zod · React Hook Form · Vercel. shadcn/ui, TanStack Query e Zustand só quando o
projeto precisar — registre no `docs/ARCHITECTURE.md`.
