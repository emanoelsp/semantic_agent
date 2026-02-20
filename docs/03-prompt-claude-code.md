# Prompt Final para Claude Code

> **Uso:** Copie o bloco abaixo e cole diretamente no Claude Code. O prompt foi utilizado para registrar o "thing" (ATO - Asset Administration Shell) e criar o README e a documentação em `/docs/`.

---

## Bloco para Copiar e Colar

```
<contexto>
Projeto acadêmico (Pós-graduação em IA Aplicada - Avaliação Intermediária). 
Implementar um MVP de Agente Cognitivo para Instanciação Automatizada e 
Orquestração de Asset Administration Shells (AAS) em cenários industriais 
híbridos via Alinhamento Semântico Restrito (TOON - Token-Oriented Object Notation).
</contexto>

<objetivo>
1. Registrar o "thing" (ATO - Asset Administration Shell)
2. Criar o README com visão geral, estratégia de construção e arquitetura
3. Criar documentação em /docs/ explicando cada decisão (Gemini, NotebookLM, Claude Code)
</objetivo>

<stack>
- Next.js App Router + TailwindCSS + shadcn/ui
- Dark mode industrial (estética SCADA)
- API Routes para /api/process-ingestion (mock)
- 4 módulos: Percepção/Ingestão (A), Raciocínio (B), TOON (C), Atuação (D)
</stack>

<regras>
- Use MOCKS para todas as respostas de IA (sem integração real com LLMs)
- O sistema deve ter 4 módulos visuais claros no dashboard
- Gramática BNF para TOON: MAP{SRC='...' | TGT='ECLASS:...' | ACTION='DirectMap|Convert_Unit|Aggregate'}
</regras>

<tarefa>
1. Criar documentação estratégica: README.md e 6 docs em /docs/ (01-gemini-escopo, 02-notebooklm-prompts, 03-prompt-claude-code, 04-agente-codigo, 05-thinking-process, 06-arquitetura-solucao)
2. Configurar tema dark industrial
3. Construir endpoint API mock /api/process-ingestion
4. Construir Dashboard com os 4 módulos
5. Criar parser TOON e sistema de mock data
</tarefa>
```

---

## Observações

- O agente de código IA utilizado foi o **Claude Code** (Anthropic)
- Este prompt pode ser ajustado conforme a evolução do projeto
- Mantenha os objetivos principais: registrar o ATO e documentar as decisões

## Fluxo após o Claude Code (Etapa 4)

1. **Baixar o ZIP** gerado pelo Claude Code
2. **Fazer upload no v0.dev** — agente interligado com Vercel e GitHub
3. **Solicitar ao v0.dev** a criação das páginas iniciais e de explicação
4. **Commit no GitHub e publicação na Vercel** — realizados automaticamente pelo v0.dev
