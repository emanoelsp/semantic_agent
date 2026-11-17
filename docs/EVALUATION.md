# Avaliação do Semantic Agent

## Conjunto dourado

`eval/golden-mappings.json` contém exemplos representativos de tags industriais, descrições funcionais, IRDIs ECLASS esperados e casos que obrigatoriamente devem ir para HITL.

O conjunto é versionado junto com o código. Cada alteração de recuperação, reranking, limiar de evidência ou prompt deve ser avaliada contra ele antes de ser considerada pronta.

## Execução

```bash
pnpm evaluate:golden
```

O comando executa o baseline lexical local e imprime `recallAt1`, `recallAt5`, `recallAt10` e a precisão da expectativa de HITL. Ele não substitui uma avaliação do Pinecone/Cohere em ambiente de homologação; serve como regressão rápida e determinística do catálogo de segurança.

Falhas de recall no top-5 ou de expectativa de HITL retornam código de saída diferente de zero.

## Próxima etapa

O mesmo formato será reutilizado para uma avaliação online controlada, comparando: recuperação densa, fusão híbrida, reranking Cohere, gate de evidência e decisão final do Gemini. Métricas de custo e latência devem ser registradas por caso, sem armazenar payload industrial sensível.
