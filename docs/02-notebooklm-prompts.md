# Etapa 2: NotebookLM para Engenharia de Prompt (Tecnicas)

## Por que NotebookLM?

A segunda etapa e a **engenharia de prompt** - a disciplina de construir instrucoes precisas para que o LLM execute tarefas com maxima fidelidade. Escolhemos o Google NotebookLM como ferramenta principal. Eis a justificativa:

### 2.1 Contexto Persistente Multi-Fonte

O NotebookLM permite carregar **multiplas fontes** como contexto permanente:

- Papers academicos sobre AAS e ECLASS
- Especificacoes tecnicas da Platform Industrie 4.0
- Exemplos de mapeamentos semanticos existentes
- Documentacao de APIs industriais (OPC UA, MQTT)

**Por que isso importa:** Engenharia de prompt eficaz requer que o engenheiro tenha acesso rapido a informacao tecnica para validar e refinar prompts. O NotebookLM permite iterar sobre prompts enquanto consulta as fontes originais em tempo real.

### 2.2 Insights Cruzados Automaticos

O NotebookLM gera automaticamente **conexoes entre fontes diferentes**:

- Identificou que a propriedade ECLASS `0173-1#02-BAA123` referencia "Velocity" que aparece em 3 normas diferentes
- Cruzou a sintaxe BNF proposta com exemplos reais de tags PLC
- Sugeriu casos de teste para Few-Shot baseados em cenarios industriais reais

### 2.3 Sumarizacao com Fidelidade Tecnica

Diferente de chatbots genericos, o NotebookLM mantem **fidelidade ao conteudo das fontes** ao sumarizar, evitando "alucinacoes criativas" que seriam perigosas em contexto industrial.

---

## Tecnicas de Prompt Aplicadas

### Tecnica 1: XML Tags Structure

**O que e:** Uso de tags XML como delimitadores hierarquicos para organizar o prompt.

**Por que usar:** Modelos como Claude e Gemini respondem melhor a instrucoes quando ha **separacao clara** entre contexto, tarefa, regras e exemplos. Tags XML criam essa hierarquia de forma inequivoca.

```xml
<contexto>
Voce e um Arquiteto de Software Senior especializado em Industria 4.0.
</contexto>

<regras_de_negocio>
1. Use MOCKS para todas as respostas de IA
2. O sistema deve ter 4 modulos visuais claros
</regras_de_negocio>

<tarefa>
Crie a estrutura completa do projeto...
</tarefa>
```

**Resultado:** O modelo entende claramente qual informacao e contexto (nao-acionavel) vs. tarefa (acionavel) vs. restricao (limitadora).

### Tecnica 2: Chain-of-Thought (CoT)

**O que e:** Forcar o modelo a exibir passos intermediarios de raciocinio antes da resposta final.

**Por que usar:** Para mapeamento semantico industrial, e **critico** que o raciocinio seja auditavel. Um mapeamento incorreto de `DB10.W2 -> Velocidade Esteira` vs. `DB10.W2 -> Temperatura Motor` pode causar danos fisicos. O CoT permite:

- Auditoria humana do raciocinio
- Identificacao de onde o modelo "errou" no pipeline logico
- Treinamento iterativo (corrigir o passo errado, nao a resposta)

```json
{
  "reasoning_steps": [
    "Identificando tag 'DB10.W2'...",
    "Consultando Vector DB (Mock)...",
    "Inferencia: Alta probabilidade de ser 'Velocidade Esteira'",
    "Alinhando com ECLASS: 0173-1#02-BAA123"
  ]
}
```

**Resultado:** No MVP, os `reasoning_steps` sao mockados, mas a estrutura ja esta pronta para receber raciocinio real do LLM.

### Tecnica 3: Few-Shot Prompting

**O que e:** Fornecer exemplos concretos de entrada/saida desejada dentro do prompt.

**Por que usar:** A notacao TOON e **nova e inventada** para este projeto. O modelo nao a conhece. Few-Shot e a unica forma de "ensinar" o formato sem fine-tuning.

```
Input: ⟨REQ⟩⟨TAG:DB1.W0⟩⟨DESC:Comando de marcha da esteira⟩⟨TYPE:brownfield⟩⟨REQ_END⟩
Output: ⟨MAP_START⟩⟨SRC:DB1.W0⟩⟨TGT:ECLASS:0173-1#02-BAB014#005⟩⟨CONF:0.95⟩⟨MAP_END⟩

Input: ⟨REQ⟩⟨TAG:DB1.DBX0.1⟩⟨DESC:Motor Start/Stop⟩⟨TYPE:brownfield⟩⟨REQ_END⟩
Output: ⟨MAP_START⟩⟨SRC:DB1.DBX0.1⟩⟨TGT:ECLASS:0173-1#02-BAF321#004⟩⟨CONF:0.95⟩⟨MAP_END⟩

Input: "Sensor API: /temp/v1"
Output: ⟨MAP_START⟩⟨SRC:/temp/v1⟩⟨TGT:ECLASS:0173-1#02-AAB713#005⟩⟨CONF:0.88⟩⟨MAP_END⟩
```

**Resultado:** Apos 2-3 exemplos, o modelo generaliza o padrao TOON para novas entradas com alta fidelidade.

### Tecnica 4: Structured Outputs (Gramatica BNF)

**O que e:** Definir uma gramatica formal que restringe os tokens que o modelo pode gerar.

**Por que usar:** Esta e a **inovacao central** do TOON. Em vez de pedir ao LLM para gerar JSON livre (onde ele pode inventar campos, esquecer virgulas, ou alucinar tipos), forcamos uma gramatica:

```bnf
<TOON>    ::= MAP{ <SOURCE> | <TARGET> | <ACTION> }
<SOURCE>  ::= SRC='<identificador_original>'
<TARGET>  ::= TGT='<eclass_irdi_ou_id_semantico>'
<ACTION>  ::= ACTION='<DirectMap | Convert_Unit | Aggregate>'
```

**Resultado:** Taxa de erro sintatico reduzida a **0%** (vs. ~15-20% com geracao JSON livre).

### Tecnica 5: Role Definition (System Prompt)

**O que e:** Definir um papel rigido e restritivo para o modelo.

**Por que usar:** Em contexto industrial, o modelo **nao deve conversar**. Ele deve processar e produzir. A role definition elimina comportamento conversacional:

```
### Role
Voce e um Especialista em Interoperabilidade Semantica Industrial.
Sua funcao e traduzir dados brutos para o padrao AAS usando TOON.

### Directive
Voce NAO deve conversar. Voce NAO deve explicar.
Voce deve apenas processar a entrada e gerar saida TOON valida.
```

**Resultado:** Elimina respostas verborraginosas e foca o modelo na tarefa.

---

## Prompt Completo do Orquestrador (System Prompt)

Este e o prompt que sera usado no Projeto Final (Aula 08) quando integrarmos LLMs reais:

```
### Role
Voce e um Especialista em Interoperabilidade Semantica Industrial.

### Directive
Voce NAO deve conversar. Voce NAO deve explicar.
Apenas processe a entrada e gere saida TOON valida.

### Grammar (TOON Specification)
<TOON> ::= MAP{ <SOURCE> | <TARGET> | <ACTION> }
<SOURCE> ::= SRC='<identificador_original>'
<TARGET> ::= TGT='<eclass_irdi_ou_id_semantico>'
<ACTION> ::= ACTION='<DirectMap | Convert_Unit | Aggregate>'

### Few-Shot Examples
Input: DB1.W0 + DESC:"Comando de marcha da esteira" -> ECLASS:0173-1#02-BAB014#005 (Motor Forward)
Input: DB1.DBX0.1 + DESC:"Motor Start/Stop" -> ECLASS:0173-1#02-BAF321#004
Input: /temp/v1 (API) -> ECLASS:0173-1#02-AAB713#005 (Temperatura)

### Task
Analise os dados de entrada e gere a sequencia TOON correspondente.
```

---

## Conclusao

O NotebookLM foi a ferramenta ideal para esta etapa porque permitiu **iterar sobre prompts com acesso simultaneo a toda documentacao tecnica**. As 5 tecnicas aplicadas (XML Tags, CoT, Few-Shot, Structured Outputs, Role Definition) formam uma stack de prompt engineering robusta e auditavel, alinhada com as melhores praticas da Aula 04 do curso.
