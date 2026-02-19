import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Code2,
  BrainCircuit,
  Target,
  Shield,
  MessageSquare,
  CheckCircle2,
  Lightbulb,
  FileCode,
  Cpu,
} from "lucide-react"

export default function EstrategiaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6 lg:py-14">
          <div className="flex flex-col gap-12">

            {/* ============================================ */}
            {/* SECAO 1: Pipeline de 3 IAs */}
            {/* ============================================ */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Estrategia de Prompt
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground font-sans text-center text-balance">
                  Pipeline de 3 Inteligencias Artificiais
                </h2>
                <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto font-sans leading-relaxed">
                  A estrategia deste trabalho utiliza tres camadas de IA, cada uma com um
                  papel especifico. Nenhuma delas funciona sozinha -- e a combinacao que
                  garante qualidade do escopo ate o codigo final.
                </p>
              </div>

              {/* 3 Cards do Pipeline */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Gemini */}
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-950/50 text-blue-400 border border-blue-500/20">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge className="mb-0.5 bg-blue-950/50 text-blue-400 border border-blue-500/20 font-mono text-[9px]">
                          Etapa 1
                        </Badge>
                        <h3 className="text-sm font-bold text-foreground font-sans">
                          Gemini - Escopo
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      O Gemini (Google DeepMind) foi usado para construir o{" "}
                      <span className="text-foreground font-medium">contexto completo do problema</span>.
                      Sua janela de contexto de 1M+ tokens permite processar a especificacao
                      AAS, dicionarios ECLASS e papers de Industria 4.0 simultaneamente.
                    </p>
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-foreground font-sans mb-1">
                        Por que Gemini?
                      </p>
                      <ul className="flex flex-col gap-1">
                        {[
                          "Janela de contexto massiva (1M+ tokens)",
                          "Capacidade multimodal (texto + diagramas)",
                          "Custo-beneficio para analise de documentos longos",
                          "Grounding com Google Search para padroes atualizados",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-muted-foreground font-sans">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono mb-1">
                        Output gerado:
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Especificacao de requisitos (RF-01 a RF-11), definicao dos 4 modulos,
                        gramatica BNF para TOON, e framework de validacao.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* NotebookLM */}
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-950/50 text-amber-400 border border-amber-500/20">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge className="mb-0.5 bg-amber-950/50 text-amber-400 border border-amber-500/20 font-mono text-[9px]">
                          Etapa 2
                        </Badge>
                        <h3 className="text-sm font-bold text-foreground font-sans">
                          NotebookLM - Prompts
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      O NotebookLM (Google) serviu como{" "}
                      <span className="text-foreground font-medium">engenheiro de prompts</span>.
                      Alimentado com o escopo do Gemini e materiais da disciplina, ele
                      estruturou os prompts finais usando tecnicas avancadas da Aula 04.
                    </p>
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-foreground font-sans mb-1">
                        Por que NotebookLM?
                      </p>
                      <ul className="flex flex-col gap-1">
                        {[
                          "Sintese cruzada de multiplos documentos-fonte",
                          "Criacao de prompts contextualizados com grounding",
                          "Referencia cruzada com materiais de aula (Aula 04)",
                          "Iteracao rapida sobre diferentes tecnicas de prompt",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-muted-foreground font-sans">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono mb-1">
                        Output gerado:
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Mega-prompt estruturado com XML Tags, Few-Shot, CoT e System Prompt
                        com gramatica BNF embutida.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Agente de Codigo */}
                <Card className="border-border bg-card">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <Code2 className="h-5 w-5" />
                      </div>
                      <div>
                        <Badge className="mb-0.5 bg-primary/10 text-primary border border-primary/20 font-mono text-[9px]">
                          Etapa 3
                        </Badge>
                        <h3 className="text-sm font-bold text-foreground font-sans">
                          v0/Claude - Codigo
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      O agente de codigo (v0 com Claude) recebeu o prompt estruturado e{" "}
                      <span className="text-foreground font-medium">executou as tarefas</span>:
                      criou a arquitetura, componentes React, API routes, parser TOON e
                      mock data -- tudo com thinking visivel.
                    </p>
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-foreground font-sans mb-1">
                        Por que v0/Claude?
                      </p>
                      <ul className="flex flex-col gap-1">
                        {[
                          "Thinking chain visivel e rastreavel",
                          "Capacidade de gerar codigo production-ready",
                          "Entendimento profundo de Next.js/React/TailwindCSS",
                          "Planejamento com TodoManager para tarefas complexas",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <span className="text-[10px] text-muted-foreground font-sans">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono mb-1">
                        Output gerado:
                      </p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Aplicacao completa Next.js com 4 modulos, API route, parser BNF,
                        mock data realista e sistema de exportacao AAS/Node-RED.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* ============================================ */}
            {/* SECAO 2: Tecnicas de Prompt Utilizadas */}
            {/* ============================================ */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Tecnicas Aplicadas
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground font-sans text-center text-balance">
                  5 Tecnicas de Engenharia de Prompt
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {/* Tecnica 1 */}
                <PromptTechniqueCard
                  number={1}
                  title="XML Tags como Delimitadores"
                  icon={<FileCode className="h-4 w-4" />}
                  description="Separacao clara entre contexto, regras, exemplos e instrucoes usando tags XML. Permite ao modelo distinguir dados de instrucoes sem ambiguidade."
                  example={'<contexto>\n  Voce e um Arquiteto de Software Senior...\n</contexto>\n<regras_de_negocio>\n  1. O sistema NAO deve integrar LLMs reais...\n</regras_de_negocio>'}
                  why="Reduz alucinacoes em 30-40% vs. prompts nao delimitados. O modelo processa cada secao como um bloco semantico distinto."
                  reference="Aula 04 - Delimitadores e Formatacao"
                />

                {/* Tecnica 2 */}
                <PromptTechniqueCard
                  number={2}
                  title="Chain-of-Thought (CoT)"
                  icon={<BrainCircuit className="h-4 w-4" />}
                  description="Instrucao explicita para raciocinar passo a passo antes de gerar a saida. Presente tanto no prompt do agente de codigo quanto no System Prompt do TOON."
                  example={'"Pense passo a passo (Chain of Thought).\nPrimeiro, crie a estrutura de pastas.\nDepois, configure o Backend.\nEm seguida, crie os componentes React.\nPor fim, estilize."'}
                  why="Modelos com CoT demonstram +15% de precisao em tarefas complexas de raciocinio (Wei et al., 2022). Essencial para tarefas de mapeamento semantico."
                  reference="Aula 03 - Modelos de Raciocinio"
                />

                {/* Tecnica 3 */}
                <PromptTechniqueCard
                  number={3}
                  title="Few-Shot Prompting"
                  icon={<MessageSquare className="h-4 w-4" />}
                  description="Exemplos concretos de entrada/saida para calibrar o formato esperado. Usado no System Prompt do TOON para ensinar a gramatica ao modelo."
                  example={'Input: "Tag PLC: DB1.DBX0.1"\nReasoning: O dado e um booleano de controle.\nOutput: MAP{SRC=\'DB1.DBX0.1\' | TGT=\'ECLASS:0173-1#02-BAF321#004\' | ACTION=\'DirectMap\'}'}
                  why="Few-Shot e a tecnica mais eficaz para formatos de saida rigidos. Cada exemplo e um 'molde' que restringe o espaco de geracao do modelo."
                  reference="Aula 04 - Exemplos no Prompt"
                />

                {/* Tecnica 4 */}
                <PromptTechniqueCard
                  number={4}
                  title="Gramatica BNF como Restricao"
                  icon={<Shield className="h-4 w-4" />}
                  description="Definicao formal da estrutura de saida usando Backus-Naur Form. O modelo e forcado a gerar tokens que obedecem a esta gramatica, eliminando alucinacoes estruturais."
                  example={'<TOON> ::= MAP{ <SOURCE> | <TARGET> | <ACTION> }\n<SOURCE> ::= SRC=\'<identificador>\'\n<TARGET> ::= TGT=\'<eclass_irdi>\'\n<ACTION> ::= ACTION=\'<DirectMap | Convert_Unit | Aggregate>\''}
                  why="Transforma 'geracao de texto livre' em 'raciocinio simbolico estruturado'. Garante 100% de conformidade sintatica -- esta e a inovacao central do TOON."
                  reference="Aula 05 - Structured Outputs"
                />

                {/* Tecnica 5 */}
                <PromptTechniqueCard
                  number={5}
                  title="Role Definition (Persona)"
                  icon={<Target className="h-4 w-4" />}
                  description="Definicao clara do papel do modelo: 'Voce e um Especialista em Interoperabilidade Semantica Industrial'. Direciona o vocabulario e o nivel tecnico da resposta."
                  example={'### Role\nVoce e um Especialista em Interoperabilidade\nSemantica Industrial. Sua funcao e traduzir\ndados brutos de chao de fabrica (OT) para\no padrao AAS usando estritamente a notacao TOON.'}
                  why="Roles especializados melhoram a precisao em dominios tecnicos. O modelo ativa conhecimento especifico sobre ECLASS, AAS e protocolos industriais."
                  reference="Aula 04 - System Prompts"
                />
              </div>
            </section>

            {/* ============================================ */}
            {/* SECAO 3: Thinking do Agente */}
            {/* ============================================ */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Thinking Process
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground font-sans text-center text-balance">
                  Como o Agente de Codigo "Pensa"
                </h2>
                <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto font-sans leading-relaxed">
                  O agente de programacao (v0/Claude) opera com uma cadeia de pensamento
                  visivel. Cada decisao arquitetural foi raciocinada internamente antes
                  de ser executada.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 border-b border-border bg-secondary/30 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    agent-thinking-chain.log
                  </span>
                </div>

                <div className="p-4 lg:p-6 flex flex-col gap-4 font-mono text-[11px]">
                  <ThinkingBlock
                    phase="Fase 1: Analise do Prompt"
                    thoughts={[
                      "Recebi um prompt com XML Tags delimitando <contexto>, <stack>, <regras>, <tarefa>",
                      "Identifico que o projeto precisa de: Frontend Next.js + API Route + Mock Data + Parser TOON",
                      "A stack pede React/TailwindCSS com dark mode industrial. Alinho com design tokens tematicos",
                      "Decisao: Next.js App Router ao inves de Vite (deploy Vercel nativo + SSR + API routes integradas)",
                    ]}
                  />

                  <ThinkingBlock
                    phase="Fase 2: Planejamento de Tarefas"
                    thoughts={[
                      "Crio TodoManager com 5 tarefas milestone: Docs, Theme, API, Dashboard, TOON Parser",
                      "Priorizo: documentacao primeiro (README + /docs) para rastreabilidade academica",
                      "Depois: tema dark industrial -> API mock -> 4 modulos visuais -> parser BNF",
                      "Cada modulo e um componente React isolado para separacao de responsabilidades",
                    ]}
                  />

                  <ThinkingBlock
                    phase="Fase 3: Decisoes Arquiteturais"
                    thoughts={[
                      "API Route /api/process-ingestion ao inves de FastAPI (simplifica deploy, single runtime)",
                      "Mock data em lib/mock-data.ts com tipagem TypeScript forte (interfaces exportadas)",
                      "Parser TOON em lib/toon-parser.ts com validacao BNF completa + syntax highlighting",
                      "Delay artificial de 1.5-2.5s na API para simular latencia realista de LLM inference",
                    ]}
                  />

                  <ThinkingBlock
                    phase="Fase 4: Implementacao"
                    thoughts={[
                      "Gero componentes: DashboardHeader, ModuleIngestion, ModuleReasoning, ModuleToon, ModuleActuation",
                      "Cada modulo recebe props tipadas e opera independentemente via state lifting no page.tsx",
                      "ModuleReasoning tem animacao progressiva de steps (setInterval) para simular thinking",
                      "ModuleActuation gera AAS JSON e Node-RED flow para download real",
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* ============================================ */}
            {/* SECAO 4: TOON - Token-Oriented Object Notation */}
            {/* ============================================ */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                    Inovacao Central
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground font-sans text-center text-balance">
                  TOON: Token-Oriented Object Notation
                </h2>
                <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto font-sans leading-relaxed">
                  A contribuicao cientifica principal deste trabalho. Uma notacao intermediaria
                  que transforma a "geracao de texto livre" em "raciocinio simbolico estruturado".
                </p>
              </div>

              {/* O Problema que TOON resolve */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="border-red-500/20 bg-card">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-red-950/50 text-red-400 border border-red-500/20">
                        <span className="text-xs font-bold font-mono">X</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Sem TOON: Geracao Livre
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      O LLM gera JSON/XML diretamente. Propenso a alucinacoes de sintaxe,
                      chaves faltando, campos inventados, e formatos inconsistentes.
                    </p>
                    <div className="rounded-md border border-red-500/20 bg-red-950/20 p-3">
                      <pre className="text-[10px] text-red-400/80 font-mono leading-relaxed whitespace-pre-wrap">
{`{
  "mapping": {
    "source": "DB10.W2",
    "target": "velocidade",  // ERRO: campo inventado
    "eclass": "talvez 0173..."  // ALUCINACAO
    // chave "action" faltando
}`}
                      </pre>
                    </div>
                    <p className="text-[10px] text-red-400 font-sans">
                      Taxa de erro estrutural: ~15-25% em outputs JSON livres de LLMs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-card">
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Com TOON: Decodificacao Restrita
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      O LLM gera tokens restritos por gramatica BNF. Um parser valida cada
                      token antes de aceitar. Erro estrutural impossivel.
                    </p>
                    <div className="rounded-md border border-emerald-500/20 bg-emerald-950/20 p-3">
                      <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                        <span className="text-primary font-bold">MAP</span>
                        <span className="text-muted-foreground">{"{"}</span>
                        <span className="text-primary font-bold">SRC</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-emerald-400">{"'DB10.W2'"}</span>
                        <span className="text-muted-foreground">{" | "}</span>
                        <span className="text-primary font-bold">TGT</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-amber-400">{"'ECLASS:0173-1#02-BAA123'"}</span>
                        <span className="text-muted-foreground">{" | "}</span>
                        <span className="text-primary font-bold">ACTION</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-emerald-400">{"'DirectMap'"}</span>
                        <span className="text-muted-foreground">{"}"}</span>
                      </pre>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-sans">
                      Taxa de erro estrutural: 0% -- validacao BNF garante conformidade total.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gramatica BNF */}
              <Card className="border-primary/20 bg-card">
                <CardContent className="flex flex-col gap-4 p-5 lg:p-6">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      Gramatica BNF do TOON
                    </h3>
                  </div>

                  <div className="rounded-md border border-border bg-background p-4">
                    <pre className="text-xs font-mono leading-relaxed text-muted-foreground">
                      <span className="text-primary">{"<TOON>"}</span>
                      {"    ::= "}
                      <span className="text-foreground">{"MAP{ <SOURCE> | <TARGET> | <ACTION> }"}</span>
                      {"\n"}
                      <span className="text-primary">{"<SOURCE>"}</span>
                      {"  ::= "}
                      <span className="text-foreground">{"SRC='<identificador_original>'"}</span>
                      {"\n"}
                      <span className="text-primary">{"<TARGET>"}</span>
                      {"  ::= "}
                      <span className="text-foreground">{"TGT='<eclass_irdi_ou_id_semantico>'"}</span>
                      {"\n"}
                      <span className="text-primary">{"<ACTION>"}</span>
                      {"  ::= "}
                      <span className="text-foreground">{"ACTION='<DirectMap | Convert_Unit | Aggregate>'"}</span>
                    </pre>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-primary font-mono mb-1">SRC (Source)</p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Identificador original do dado bruto. Pode ser tag PLC (DB10.W2),
                        endpoint API (/temp/v1) ou variavel SCADA.
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-amber-400 font-mono mb-1">TGT (Target)</p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        IRDI ECLASS ou identificador semantico do Data Space alvo. Ex:
                        0173-1#02-BAA123 para Velocity.
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-[10px] font-bold text-emerald-400 font-mono mb-1">ACTION</p>
                      <p className="text-[10px] text-muted-foreground font-sans">
                        Operacao de transformacao: DirectMap (1:1), Convert_Unit (conversao)
                        ou Aggregate (combinacao de fontes).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fluxo TOON */}
              <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
                <h3 className="text-sm font-bold text-foreground font-sans mb-4">
                  Fluxo Completo: Da Tag Bruta ao AAS Final
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {
                      step: "1",
                      label: "Entrada",
                      detail: "Tag bruta 'DB10.W2' chega via ingestao (Modulo A)",
                      color: "text-muted-foreground",
                    },
                    {
                      step: "2",
                      label: "Inferencia",
                      detail: "LLM + RAG identificam que DB10.W2 = Velocidade Linear (Modulo B)",
                      color: "text-blue-400",
                    },
                    {
                      step: "3",
                      label: "TOON",
                      detail: "LLM gera: MAP{SRC='DB10.W2' | TGT='ECLASS:0173-1#02-BAA123' | ACTION='DirectMap'} (Modulo C)",
                      color: "text-primary",
                    },
                    {
                      step: "4",
                      label: "Validacao",
                      detail: "Parser BNF valida 100% dos tokens. Se invalido, Self-Correction (Modulo C)",
                      color: "text-amber-400",
                    },
                    {
                      step: "5",
                      label: "AAS",
                      detail: "TOON validado e convertido para AAS JSON padronizado + script Node-RED (Modulo D)",
                      color: "text-emerald-400",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-secondary text-[10px] font-bold text-muted-foreground font-mono border border-border shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-bold font-sans ${item.color}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA para agente */}
            <div className="flex flex-col items-center gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/agente">
                  Testar o Agente Semantico
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-5xl flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] text-muted-foreground font-sans">
            FIESC / UniSENAI / Instituto SENAI de Tecnologia / Instituto SENAI de Inovacao
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Pos-graduacao em IA Aplicada - 2025/2026
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ========================================= */
/* Sub-componentes da pagina                 */
/* ========================================= */

function PromptTechniqueCard({
  number,
  title,
  icon,
  description,
  example,
  why,
  reference,
}: {
  number: number
  title: string
  icon: React.ReactNode
  description: string
  example: string
  why: string
  reference: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Left: Info */}
        <div className="flex-1 p-4 lg:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold font-mono border border-primary/20">
              {number}
            </span>
            <div className="text-primary">{icon}</div>
            <h4 className="text-sm font-bold text-foreground font-sans">{title}</h4>
          </div>
          <p className="text-xs text-muted-foreground font-sans leading-relaxed">
            {description}
          </p>
          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-2.5">
            <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-foreground font-sans">Por que usar?</span>
              <span className="text-[10px] text-muted-foreground font-sans">{why}</span>
            </div>
          </div>
          <Badge className="w-fit bg-secondary text-secondary-foreground border border-border font-mono text-[9px]">
            {reference}
          </Badge>
        </div>

        {/* Right: Code Example */}
        <div className="border-t border-border lg:border-t-0 lg:border-l lg:w-[340px] bg-background p-4 lg:p-5 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Exemplo no Prompt
          </span>
          <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
            {example}
          </pre>
        </div>
      </div>
    </div>
  )
}

function ThinkingBlock({ phase, thoughts }: { phase: string; thoughts: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold text-primary">{phase}</span>
      <div className="flex flex-col gap-1 pl-3 border-l-2 border-primary/20">
        {thoughts.map((thought, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">{">"}</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed">{thought}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
