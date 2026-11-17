# Arquitetura de Produção

## Modelo mental do produto

O Semantic Agent é organizado em três camadas: **sintática** para transportar e
normalizar dados de CLPs/IoT, **semântica** para atribuir significado ECLASS/AAS
e **cognitiva** para raciocinar com Gemini, evidência RAG e revisão humana.

## Stack principal

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase Auth
- Firestore
- Firebase Storage (se necessário)
- Vercel
- Pinecone (RAG ECLASS)
- Gemini API (inferência e embeddings)
- Mercado Pago (créditos e quota edge)

## Fluxo de uma conversão

```txt
Node-RED / Dashboard
        │ HTTPS + API key ou sessão
        ▼
Route Handler ── schema Zod ── guardrail industrial ── auth/quota
        │
        ├── Pinecone top-20 + catálogo ECLASS local → fusão RRF
        ├── Cohere Rerank top-5 (quando configurado)
        ├── Gemini com prompt restrito/TOON
        └── parser TOON + gate de evidência + validação dimensional
        │
        ├── confiança >= 0.85 → AAS v3.0/AASX
        └── confiança < 0.85 → fila HITL + resposta warning
```

O catálogo local é uma barreira de segurança e uma segunda perna lexical da
recuperação, combinada com Pinecone por Reciprocal Rank Fusion. O Cohere apenas
reordena candidatos recuperados; não cria IRDIs. Se o reranker falhar, o
pipeline usa os candidatos híbridos e registra a degradação. O gate de
evidência exige que o IRDI proposto apareça no contexto recuperado; caso
contrário, a decisão vai para HITL mesmo que a confiança textual do modelo
seja alta.

`PINECONE_METADATA_FILTER_JSON` permite limitar a recuperação por metadados do
índice, mas só deve ser preenchido depois que o esquema de ingestão tiver sido
confirmado.

Cada execução autenticada registra um evento mínimo em `usage_events` com
latência, fonte, tokens Gemini, unidades Cohere, custo estimado e decisão HITL.
O ledger não substitui a liquidação financeira: o saldo ainda é reservado pela
quota da operação e a liquidação por uso real continua sendo uma etapa de
billing posterior.

Quando a busca densa falha ou retorna poucos candidatos, há no máximo uma
consulta corretiva usando a descrição funcional/tag normalizada. Não existe
loop autônomo de recuperação; o limite mantém latência e custo previsíveis.

## Endpoints comerciais

| Endpoint | Uso | Cobrança |
|---|---|---:|
| `POST /api/billing/quote` | Cotação estimada por operação | sem cobrança |
| `POST /api/orchestrator` | Uma variável/tag | 1 crédito |
| `POST /api/extract-datasheet` | Extração + mapeamento PDF | 2 créditos |
| `POST /api/export-aasx` | Exportação autenticada | sem cobrança adicional |
| `GET/POST /api/hitl` | Revisão humana do próprio usuário | sem cobrança |
| `POST /api/edge/license` | Lease e telemetria Node-RED | quota edge |

## Bibliotecas recomendadas

- Zod para validação
- React Hook Form para formulários
- TanStack Query / Zustand só se a feature precisar (cache compartilhado entre telas, estado global real)
- `@axe-core/playwright` para auditoria de acessibilidade (skill global `test-strategy`)
- Sentry para monitoramento de erros
- PostHog para analytics
- Resend para e-mails
- Stripe para pagamentos (se necessário)
- Toastify para retorno de ações básicas
- SweetAlert2 para ações complexas que precisam de confirmação

## Estrutura atual

```txt
/app
  /api
  /components
    /ui
    /shared
    /features
/lib
  /firebase
  /rag
/hooks
/prompts
/edge/node-red-contrib-semantic-agent
/docs
```

## Regras técnicas

- Preferir Server Components quando possível.
- Usar Client Components apenas quando necessário.
- Separar lógica de UI.
- Validar dados com Zod.
- Nunca acessar Firestore diretamente em componentes complexos.
- Centralizar configuração Firebase em `/lib/firebase`.
- Criar services para operações de banco.
- Não usar fallback demo em produção; sem Gemini configurado, a API falha de
  forma explícita.
- Não confiar no LLM como catálogo: IRDI, unidade e tipo passam por validação
  programática.
- Não consumir crédito para payload inválido; devolver a reserva em falha do
  pipeline.
- Segredos somente em variáveis de ambiente; `SESSION_SECRET` é obrigatório em
  produção.

## Design tokens

- Definir cores em **OKLCH** e as curvas/durações de animação como variáveis CSS
  semânticas (ex.: `--ease-out`, `--ease-drawer`). Regras completas na skill global `design-engineering`.
- Centralizar os tokens em um único ponto (ex.: `globals.css` / config do Tailwind)
  para manter consistência de tema e motion em todo o projeto.
