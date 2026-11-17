# PRD — Semantic Agent

## Posicionamento

**Semantic Agent — Da tag cega à inteligência industrial.**

O produto oferece processamento **sintático, semântico e cognitivo** para
conectar CLPs, IoT e Asset Administration Shells. A promessa comercial é
simples: transformar uma tag legada, um endpoint ou um datasheet em significado
industrial rastreável e em artefatos prontos para integração.

## Camadas do produto

- **Sintática:** ingestão e normalização de tags, protocolos, telemetria e PDFs.
- **Semântica:** alinhamento com ECLASS, unidades e modelos IDTA AAS, apoiado por RAG.
- **Cognitiva:** Gemini, guardrails, confiança e HITL para decidir e gerar saídas operacionais.

## Objetivo

Oferecer uma API pay-as-you-go que converte tags de CLP, endpoints e dados de
datasheets em mapeamentos semânticos ECLASS/IDTA AAS, com integração para
Node-RED. O sistema deve ser útil para OEMs, integradores e desenvolvedores de
software industrial sem exigir que o dado de operação deixe o edge sem controle.

## Escopo do MVP comercial

- Mapeamento de uma variável via `POST /api/orchestrator`.
- Extração de datasheet PDF via `POST /api/extract-datasheet`.
- RAG opcional com Pinecone e embeddings Gemini.
- Reranking opcional com Cohere para ordenar candidatos ECLASS antes do Gemini.
- Validação de formato, catálogo ECLASS local, unidade e compatibilidade física.
- HITL para resultados abaixo de 85% de confiança.
- Geração de ambiente AAS v3.0/AASX e fluxo Node-RED.
- Firebase para identidade, créditos, histórico, HITL e Storage.
- Mercado Pago para recarga de créditos e quota edge.

## Limites de segurança do produto

- O LLM nunca é a fonte de verdade de um IRDI: o código deve existir no
  catálogo indexado/local ou ser marcado para revisão.
- O reranker não é fonte de verdade: ele somente reordena candidatos existentes
  e sua falha deve degradar para o ranking do Pinecone.
- Conteúdo de RAG é evidência, não instrução; entrada do usuário não altera as
  regras do sistema.
- Fallback determinístico é permitido apenas em desenvolvimento e é rotulado
  como `fallback`; produção falha de forma explícita sem Gemini.
- Uploads são limitados a PDF real de até 20 MB e payloads têm schema Zod.
- Pagamento só é creditado por webhook assinado/validado ou confirmação
  autorizada no Mercado Pago.

## Política de preço e medição

O Semantic Agent usa créditos pré-pagos como unidade comercial. O custo da
conta Gemini/Pinecone é um custo interno da plataforma; ele não deve ser
exposto como se fosse o preço final do cliente. A precificação deve seguir este
fluxo:

1. **Cotação:** estima créditos com base na operação, tamanho do payload,
   quantidade de pontos do datasheet ou lote de telemetria.
2. **Reserva:** bloqueia a estimativa máxima antes de chamar Gemini, Pinecone
   ou uma integração externa.
3. **Execução:** registra tokens de entrada/saída, embeddings, leituras RAG,
   bytes/páginas e tempo de processamento.
4. **Liquidação:** calcula o custo real, aplica margem e devolve a diferença da
   reserva. Em falha, devolve toda a reserva.

Uma fórmula operacional é:

```txt
custo_provedor_usd =
  (tokens_entrada / 1_000_000 × preço_gemini_entrada) +
  (tokens_saida / 1_000_000 × preço_gemini_saida) +
  (tokens_embedding / 1_000_000 × preço_embedding) +
  (read_units / 1_000_000 × preço_pinecone) + infraestrutura

preço_cliente_brl = max(
  custo_mínimo_da_operacao,
  custo_provedor_usd × câmbio_usd_brl × margem
)
créditos = teto(preço_cliente_brl / valor_do_crédito)
```

Os parâmetros ficam no `.env.local` durante o desenvolvimento e devem ser
configurados como segredos/variáveis protegidas no ambiente de produção. A
implementação atual ainda reserva 1 crédito por mapeamento e 2 por datasheet;
o ledger de uso e a liquidação por tokens devem ser concluídos antes de chamar
o preço de custo real-time de definitivo.
