# Etapa 3: Claude Code para Execução de Tarefas

## Por que o Claude Code?

A terceira etapa é a **implementação efetiva do sistema**. Aqui, utilizamos o **Claude Code** (agente de codificação IA da Anthropic) como executor de tarefas. O prompt original tinha como objetivo: (1) registrar o "thing" (ATO - Asset Administration Shell), e (2) criar o README e a documentação em `/docs/`. A justificativa:

### 3.1 Analise de Codebase Antes de Implementar

Diferente de um gerador de codigo simples, um agente de codigo:

- **Lê o projeto existente** antes de gerar novo código
- **Identifica padrões** já utilizados (componentes, estilos, convenções)
- **Evita duplicações** ao verificar se funcionalidades já existem
- **Mantém consistência** com a arquitetura existente

### 3.2 Decomposição Automática de Tarefas

O Claude Code utiliza um **TodoManager** para decompor projetos complexos:

```
1. [DONE] Registrar o thing (ATO) e criar documentação estratégica (README + docs)
2. [IN-PROGRESS] Configurar tema dark industrial
3. [TODO] Construir endpoints API mock
4. [TODO] Construir Dashboard com 4 modulos
5. [TODO] Criar parser TOON e sistema de mock data
```

**Por que isso importa:** Projetos de engenharia de software falham quando não há **decomposição clara em milestones**. O Claude Code garante que cada tarefa seja:
- Independente (pode ser testada isoladamente)
- Sequencial (depende de anteriores estarem prontas)
- Verificavel (tem criterio claro de conclusao)

### 3.3 Habilidades Expostas

O Claude Code possui habilidades especializadas que são **orquestradas automaticamente**:

| Habilidade | Descricao | Quando Usar |
|-----------|-----------|-------------|
| `Glob` | Busca de arquivos por padrão | Encontrar componentes existentes |
| `Grep` | Busca de conteúdo em arquivos | Verificar imports, padrões |
| `Read` | Leitura de arquivos | Entender código antes de editar |
| `Edit` | Edição precisa de arquivos | Modificações cirúrgicas |
| `Write` | Criação de novos arquivos | Componentes, APIs, docs |
| `TodoManager` | Gestao de tarefas | Planejamento de milestones |
| `GenerateDesignInspiration` | Inspiração visual | Design de interfaces |
| `WebSearch` | Busca na web | Documentação atualizada |

### 3.4 Design Thinking Integrado

Antes de implementar a UI, o Claude Code:

1. **Gera inspiração de design** com contexto industrial
2. **Define paleta de cores** e tokens semanticos
3. **Escolhe tipografia** adequada ao contexto
4. **Implementa** seguindo o design brief gerado

---

## Fluxo de Trabalho do Claude Code

```
[Usuário envia requisitos]
        |
        v
[Claude Code analisa codebase existente]
        |
        v
[Claude Code cria plano de tarefas (TodoManager)]
        |
        v
[Claude Code gera inspiração de design]
        |
        v
[Para cada tarefa:]
  |-> Lê arquivos relevantes
  |-> Identifica padrões existentes
  |-> Implementa com consistencia
  |-> Verifica resultado
  |-> Marca tarefa como concluída
        |
        v
[Postamble: Resumo das mudancas]
```

---

## Planejamento Aplicado Neste Projeto

### Tarefas Definidas:

1. **Registrar o thing (ATO) e criar documentação estratégica** - README e 5 docs detalhados explicando cada decisão
2. **Configurar tema dark industrial** - Tokens de cor, tipografia, layout base
3. **Construir endpoints API mock** - `/api/process-ingestion` com mock realista
4. **Construir Dashboard com 4 modulos** - Percepcao, Raciocinio, TOON, Atuacao
5. **Criar parser TOON e sistema de mock** - Dados simulados, delays realistas

### Decisões de Arquitetura:

- **Next.js App Router** (nao Pages Router): Melhor performance com Server Components
- **API Routes** (nao FastAPI separado): Fullstack integrado, deploy simplificado
- **shadcn/ui** (nao Material UI): Componentes temaveis, Dark Mode nativo
- **Mocks com delay** (nao dados estaticos): Simula latencia real de LLM

---

## Exemplo de Interação com o Claude Code

```
[Instrução] "Crie o endpoint de processamento de ingestão"

[Claude Code Thinking]
> Preciso criar uma API Route em /app/api/process-ingestion/route.ts
> O endpoint deve aceitar POST com arquivo ou JSON
> Deve retornar resposta mockada com reasoning_steps e toon_output
> Devo adicionar delay de 2s para simular latencia de LLM
> Verificar se existe padrao de API Route no projeto...

[Claude Code Executa]
> Read /app/api/* -> Nenhuma API existe ainda
> Write /app/api/process-ingestion/route.ts com mock handler
> Verificar que endpoint responde corretamente
```

---

## Conclusão

O Claude Code foi a ferramenta ideal para esta etapa porque projetos de software industrial exigem **consistência, planejamento e rastreabilidade**. Diferente de copiar/colar snippets, o Claude Code garante que cada linha de código esteja alinhada com o codebase existente, os padrões do framework e os requisitos do projeto.
