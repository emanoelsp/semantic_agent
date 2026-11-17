# Tasks — Produção

## Concluído nesta etapa

- [x] Validar schemas de entrada e saída crítica com Zod/JSON Schema.
- [x] Cobrar somente depois da validação inicial e devolver créditos em falhas.
- [x] Diferenciar `llm`, `rag` e `fallback` no resultado da API.
- [x] Integrar consulta Pinecone opcional com embeddings Gemini e timeout.
- [x] Integrar Cohere Rerank opcional entre Pinecone e Gemini, com fallback seguro.
- [x] Criar conjunto dourado e harness determinístico de regressão.
- [x] Combinar Pinecone com catálogo lexical local por Reciprocal Rank Fusion.
- [x] Adicionar filtro de metadados opcional ao Pinecone.
- [x] Adicionar gate de evidência com encaminhamento HITL.
- [x] Adicionar uma tentativa única de recuperação corretiva para tags opacas.
- [x] Expor tokens Gemini, unidades Cohere e custo estimado por execução.
- [x] Desativar endpoints mock/internos em produção.
- [x] Remover segredo padrão de sessão em produção e usar scrypt para senhas.
- [x] Endurecer webhook Mercado Pago, cookie de sessão, HITL e simulador edge.
- [x] Fazer o build respeitar erros de TypeScript.

## Próxima etapa obrigatória antes de vender

- [ ] Provisionar Firebase Admin, Storage e regras/índices Firestore.
- [ ] Criar índice Pinecone com a mesma dimensão de `PINECONE_EMBEDDING_DIMENSION`.
- [ ] Ingerir somente ECLASS licenciado/oficial e versionar o namespace.
- [ ] Configurar segredo do webhook Mercado Pago e testar PIX/cartão em sandbox.
- [ ] Adicionar rate limit distribuído (Upstash/Redis) para múltiplas instâncias.
- [x] Persistir latência, tokens, custo estimado, taxa HITL e fonte em `usage_events`.
- [x] Persistir `billed_units.search_units` da Cohere no ledger de uso.
- [ ] Criar ledger de uso por organização com tokens Gemini, embeddings, RAG,
      bytes/páginas e custo interno por execução.
- [ ] Implementar cotação, reserva e liquidação de créditos; não cobrar apenas
      um valor fixo quando o custo real da operação variar.
- [ ] Expor ao cliente o detalhamento da cobrança sem expor chaves ou segredos
      da conta Gemini/Pinecone da plataforma.
- [ ] Criar testes unitários, contrato de API e E2E para cobrança e autenticação.
- [x] Executar uma avaliação de mapeamento com conjunto rotulado por engenheiros.
- [ ] Publicar pacote Node-RED e documentar política de offline lease/rotação.
