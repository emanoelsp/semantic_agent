"use client"

import { useState, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { AASExplainer } from "@/components/aas-explainer"
import { ModuleIngestion } from "@/components/module-ingestion"
import { ModuleReasoning } from "@/components/module-reasoning"
import { ModuleToon } from "@/components/module-toon"
import { ModuleActuation } from "@/components/module-actuation"
import { Badge } from "@/components/ui/badge"
import { Activity, Wifi, Info } from "lucide-react"
import type { ProcessingResult } from "@/lib/mock-data"

export default function AgentePage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [lastProcessingTime, setLastProcessingTime] = useState<number | undefined>()

  const handleProcess = useCallback(
    async (inputData: string, inputType: "brownfield" | "greenfield") => {
      setIsProcessing(true)
      setResult(null)

      try {
        const startTime = Date.now()
        const response = await fetch("/api/process-ingestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputData, inputType }),
        })

        if (!response.ok) {
          throw new Error("Erro no processamento")
        }

        const data: ProcessingResult = await response.json()
        const elapsed = Date.now() - startTime

        setResult(data)
        setLastProcessingTime(elapsed)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 flex flex-col">
        {/* Agent Header */}
        <div className="border-b border-border px-4 py-3 lg:px-6">
          <div className="mx-auto max-w-7xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-bold text-foreground font-sans">
                Agente Semantico Interativo
              </h1>
              <p className="text-xs text-muted-foreground font-sans">
                Insira uma tag industrial ou endpoint de API e observe o pipeline de
                mapeamento semantico em acao.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastProcessingTime && (
                <span className="text-xs text-muted-foreground font-mono">
                  {lastProcessingTime}ms
                </span>
              )}
              <Badge
                variant={isProcessing ? "default" : "secondary"}
                className={`flex items-center gap-1.5 font-mono text-xs ${
                  isProcessing
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                <Activity
                  className={`h-3 w-3 ${isProcessing ? "animate-pulse" : ""}`}
                />
                {isProcessing ? "Processando" : "Idle"}
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 font-mono text-xs"
              >
                <Wifi className="h-3 w-3" />
                Mock
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-7xl flex flex-col gap-4">
            {/* AAS Explainer (expandable) */}
            <AASExplainer />

            {/* Didactic: How to use */}
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/20 px-4 py-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-foreground font-sans">
                  Como usar este agente?
                </p>
                <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                  <span className="text-foreground font-medium">1.</span> No{" "}
                  <span className="text-primary font-medium">Modulo A</span> (canto superior
                  esquerdo), selecione Brownfield ou Greenfield e insira uma tag.
                  Experimente os exemplos pre-carregados como{" "}
                  <code className="text-primary font-mono text-[10px]">DB10.W2</code> ou{" "}
                  <code className="text-primary font-mono text-[10px]">/temp/v1</code>.{" "}
                  <span className="text-foreground font-medium">2.</span> O{" "}
                  <span className="text-primary font-medium">Modulo B</span> mostra o raciocinio
                  passo a passo do agente (simulado).{" "}
                  <span className="text-foreground font-medium">3.</span> O{" "}
                  <span className="text-primary font-medium">Modulo C</span> exibe o codigo TOON
                  gerado com syntax highlighting e validacao BNF.{" "}
                  <span className="text-foreground font-medium">4.</span> O{" "}
                  <span className="text-primary font-medium">Modulo D</span> permite exportar o
                  AAS JSON ou script Node-RED.
                </p>
              </div>
            </div>

            {/* Pipeline Flow Indicator */}
            <div className="flex items-center justify-center gap-2">
              <PipelineStep
                label="A"
                name="Percepcao e Ingestao"
                active={isProcessing}
                done={!!result}
              />
              <PipelineArrow />
              <PipelineStep
                label="B"
                name="Raciocinio Semantico"
                active={isProcessing}
                done={!!result}
              />
              <PipelineArrow />
              <PipelineStep
                label="C"
                name="Geracao TOON"
                active={isProcessing}
                done={!!result}
              />
              <PipelineArrow />
              <PipelineStep
                label="D"
                name="Atuacao e Export"
                active={isProcessing}
                done={!!result}
              />
            </div>

            {/* Grid 2x2 dos 4 Modulos */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <ModuleIngestion
                onProcess={handleProcess}
                isProcessing={isProcessing}
              />
              <ModuleReasoning
                steps={result?.reasoningSteps || []}
                isProcessing={isProcessing}
                confidence={result?.confidence ?? null}
              />
              <ModuleToon
                toonOutput={result?.toonOutput || null}
                isProcessing={isProcessing}
              />
              <ModuleActuation result={result} isProcessing={isProcessing} />
            </div>

            {/* Didactic Footer Legend */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2">
                Legenda dos Modulos
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    mod: "A",
                    name: "Percepcao e Ingestao",
                    rfs: "RF-01/03",
                    desc: "Recebe dados brutos de PLCs (Brownfield) ou APIs de CPS (Greenfield). Faz pre-processamento lexico.",
                  },
                  {
                    mod: "B",
                    name: "Raciocinio Semantico",
                    rfs: "RF-04/06",
                    desc: "Usa RAG (LLM + Vector DB) para inferir o significado semantico e alinhar com ECLASS. Gera confidence score.",
                  },
                  {
                    mod: "C",
                    name: "Geracao TOON",
                    rfs: "RF-07/09",
                    desc: "Gera tokens TOON validados por gramatica BNF. Garante 0% erro estrutural. Self-Correction se invalido.",
                  },
                  {
                    mod: "D",
                    name: "Atuacao e Export",
                    rfs: "RF-10/11",
                    desc: "Converte TOON validado em AAS JSON padronizado e/ou scripts Node-RED para Edge Computing.",
                  },
                ].map((item) => (
                  <div
                    key={item.mod}
                    className="rounded border border-border bg-secondary/20 p-2.5 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold font-mono">
                        {item.mod}
                      </span>
                      <span className="text-[10px] font-bold text-foreground font-sans">
                        {item.name}
                      </span>
                    </div>
                    <Badge className="w-fit bg-secondary text-muted-foreground border border-border font-mono text-[9px]">
                      {item.rfs}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground font-sans leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3">
          <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-[10px] text-muted-foreground font-sans">
              TOON Semantic Agent - Avaliacao Intermediaria IA Generativa
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              Mock Mode | Gramatica BNF v1.0 | ECLASS Simulated
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

function PipelineStep({
  label,
  name,
  active,
  done,
}: {
  label: string
  name: string
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold font-mono transition-colors ${
          active
            ? "bg-primary/20 text-primary border border-primary/40 animate-pulse"
            : done
              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20"
              : "bg-secondary text-muted-foreground border border-border"
        }`}
      >
        {label}
      </div>
      <span className="hidden text-[10px] text-muted-foreground sm:inline font-sans">
        {name}
      </span>
    </div>
  )
}

function PipelineArrow() {
  return <div className="flex h-[1px] w-4 bg-border sm:w-8" />
}
