# Etapa 3: Agente de Codigo para Execucao de Tarefas

## Por que um Agente de Codigo?

A terceira etapa e a **implementacao efetiva do sistema**. Aqui, utilizamos um Agente de Codigo (v0/Claude) como executor de tarefas. A justificativa:

### 3.1 Analise de Codebase Antes de Implementar

Diferente de um gerador de codigo simples, um agente de codigo:

- **Le o projeto existente** antes de gerar novo codigo
- **Identifica padroes** ja utilizados (componentes, estilos, convencoes)
- **Evita duplicacoes** ao verificar se funcionalidades ja existem
- **Mantem consistencia** com a arquitetura existente

### 3.2 Decomposicao Automatica de Tarefas

O agente utiliza um **TodoManager** para decompor projetos complexos:

```
1. [DONE] Criar documentacao estrategica (README + docs)
2. [IN-PROGRESS] Configurar tema dark industrial
3. [TODO] Construir endpoints API mock
4. [TODO] Construir Dashboard com 4 modulos
5. [TODO] Criar parser TOON e sistema de mock data
```

**Por que isso importa:** Projetos de engenharia de software falham quando nao ha **decomposicao clara em milestones**. O agente garante que cada tarefa e:
- Independente (pode ser testada isoladamente)
- Sequencial (depende de anteriores estarem prontas)
- Verificavel (tem criterio claro de conclusao)

### 3.3 Habilidades Expostas

O agente de codigo possui habilidades especializadas que sao **orquestradas automaticamente**:

| Habilidade | Descricao | Quando Usar |
|-----------|-----------|-------------|
| `Glob` | Busca de arquivos por padrao | Encontrar componentes existentes |
| `Grep` | Busca de conteudo em arquivos | Verificar imports, padroes |
| `Read` | Leitura de arquivos | Entender codigo antes de editar |
| `Edit` | Edicao precisa de arquivos | Modificacoes cirurgicas |
| `Write` | Criacao de novos arquivos | Componentes, APIs, docs |
| `TodoManager` | Gestao de tarefas | Planejamento de milestones |
| `GenerateDesignInspiration` | Inspiracao visual | Design de interfaces |
| `WebSearch` | Busca na web | Documentacao atualizada |

### 3.4 Design Thinking Integrado

Antes de implementar a UI, o agente:

1. **Gera inspiracao de design** com contexto industrial
2. **Define paleta de cores** e tokens semanticos
3. **Escolhe tipografia** adequada ao contexto
4. **Implementa** seguindo o design brief gerado

---

## Fluxo de Trabalho do Agente

```
[Usuario envia requisitos]
        |
        v
[Agente analisa codebase existente]
        |
        v
[Agente cria plano de tarefas (TodoManager)]
        |
        v
[Agente gera inspiracao de design]
        |
        v
[Para cada tarefa:]
  |-> Le arquivos relevantes
  |-> Identifica padroes existentes
  |-> Implementa com consistencia
  |-> Verifica resultado
  |-> Marca tarefa como concluida
        |
        v
[Postamble: Resumo das mudancas]
```

---

## Planejamento Aplicado Neste Projeto

### Tarefas Definidas:

1. **Criar documentacao estrategica** - README e 5 docs detalhados explicando cada decisao
2. **Configurar tema dark industrial** - Tokens de cor, tipografia, layout base
3. **Construir endpoints API mock** - `/api/process-ingestion` com mock realista
4. **Construir Dashboard com 4 modulos** - Percepcao, Raciocinio, TOON, Atuacao
5. **Criar parser TOON e sistema de mock** - Dados simulados, delays realistas

### Decisoes de Arquitetura:

- **Next.js App Router** (nao Pages Router): Melhor performance com Server Components
- **API Routes** (nao FastAPI separado): Fullstack integrado, deploy simplificado
- **shadcn/ui** (nao Material UI): Componentes temaveis, Dark Mode nativo
- **Mocks com delay** (nao dados estaticos): Simula latencia real de LLM

---

## Exemplo de Interacao com o Agente

```
[Instrucao] "Crie o endpoint de processamento de ingestao"

[Agente Thinking]
> Preciso criar uma API Route em /app/api/process-ingestion/route.ts
> O endpoint deve aceitar POST com arquivo ou JSON
> Deve retornar resposta mockada com reasoning_steps e toon_output
> Devo adicionar delay de 2s para simular latencia de LLM
> Verificar se existe padrao de API Route no projeto...

[Agente Executa]
> Read /app/api/* -> Nenhuma API existe ainda
> Write /app/api/process-ingestion/route.ts com mock handler
> Verificar que endpoint responde corretamente
```

---

## Conclusao

O agente de codigo foi a ferramenta ideal para esta etapa porque projetos de software industrial exigem **consistencia, planejamento e rastreabilidade**. Diferente de copiar/colar snippets, o agente garante que cada linha de codigo esteja alinhada com o codebase existente, os padroes do framework e os requisitos do projeto.
