# Integração Node-RED com o Orquestrador Semântico

Este documento descreve como obter o fluxo Node-RED gerado pelo Orquestrador e integrá-lo ao seu flow existente.

---

## Visão geral

O Orquestrador gera um fluxo Node-RED que:

1. **Lê** dados do ativo (tag PLC ou endpoint API)
2. **Transforma** aplicando o mapeamento ECLASS (semanticId, unidade)
3. **Publica** no registry AAS (ou envia para o próximo nó)

O fluxo pode ser importado como uma nova aba ou seus nós podem ser copiados para um flow existente.

---

## Passo 1: Obter o JSON

1. Processe uma tag no Orquestrador (ex.: `DB1.W0` com descrição "Comando de marcha da esteira", ou `Mtr_Tmp_01`).
2. Avance até a **Página 4: Modelagem Funcional**.
3. Abra a aba **Node-RED**.
4. Clique em **"Baixar JSON Node-RED"** ou copie o JSON exibido.

---

## Passo 2: Importar no Node-RED

### Via Clipboard

1. Node-RED → Menu (☰) → **Import** → **Clipboard**
2. Cole o JSON
3. Clique em **Import**

### Via Arquivo

1. Salve o JSON em um arquivo (ex.: `nodered-Mtr_Tmp_01.json`)
2. Menu → **Import** → **Select a file to import**
3. Selecione o arquivo → **Import**

---

## Passo 3: Integrar ao seu flow

### Opção A: Usar como aba separada

- O fluxo importado aparece como nova aba.
- Ajuste a URL do registry AAS no nó "Publish AAS" se necessário.
- Clique em **Deploy**.

### Opção B: Copiar nós para flow existente

1. Arraste os nós da aba gerada para sua aba principal.
2. Conecte:
   - **Entrada:** seu nó de origem (PLC, MQTT, etc.) → **Read [tag]**
   - **Saída:** **Log** ou **Publish AAS** → seus nós downstream
3. Remova a aba vazia se desejar.
4. **Deploy**.

### Opção C: Conectar o fluxo TOON entre nós

```
[Seu nó de entrada] ──► [Read [tag]] ──► [TOON Transform] ──► [Publish AAS] ──► [Seus nós]
```

O nó **Read [tag]** é o ponto de entrada. Conecte a saída do seu nó que lê o PLC ou API.

---

## IDs dos nós gerados

Cada fluxo usa IDs únicos baseados na tag para evitar conflitos ao importar múltiplos fluxos:

| ID (sufixo) | Tipo       | Função                         |
|-------------|------------|--------------------------------|
| `[tag]_tab` | tab        | Aba do fluxo                   |
| `[tag]_inject` | s7 in / http request | Leitura da tag/endpoint |
| `[tag]_transform` | function | Mapeamento TOON → ECLASS       |
| `[tag]_aas` | http request | Publicação no AAS registry  |
| `[tag]_debug` | debug     | Saída de depuração             |

Exemplo para `Mtr_Tmp_01`: `Mtr_Tmp_01_inject`, `Mtr_Tmp_01_transform`, etc.

---

## Dependências

### Brownfield (PLC Siemens S7)

Instale o pacote contrib para o nó `s7 in`:

```bash
cd ~/.node-red
npm install node-red-contrib-s7
```

Reinicie o Node-RED após a instalação.

### Greenfield (API REST)

O nó `http request` é nativo. Nenhuma dependência adicional.

---

## Configuração do AAS Registry

Por padrão, o nó "Publish AAS" envia para:

```
http://aas-registry:8080/api/v1/submodels/TechnicalData/elements
```

Altere a **url** no nó para o endpoint do seu registry AAS.

---

## Licença

Projeto acadêmico - Avaliação Final de IA Generativa.
