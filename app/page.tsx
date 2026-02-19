"use client"

import { useState, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ModuleIngestion } from "@/components/module-ingestion"
import { ModuleReasoning } from "@/components/module-reasoning"
import { ModuleToon } from "@/components/module-toon"
import { ModuleActuation } from "@/components/module-actuation"
import type { ProcessingResult } from "@/lib/mock-data"

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [lastProcessingTime, setLastProcessingTime] = useState<number | undefined>()

  const handleProcess = useCallback(async (inputData: string, inputType: "brownfield" | "greenfield") => {
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
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        isProcessing={isProcessing}
        lastProcessingTime={lastProcessingTime}
      />

      <main className="flex-1 p-4 lg:p-6">
        {/* Pipeline Flow Indicator */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <PipelineStep label="A" name="Ingestao" active={isProcessing} done={!!result} />
          <PipelineArrow />
          <PipelineStep label="B" name="Raciocinio" active={isProcessing} done={!!result} />
          <PipelineArrow />
          <PipelineStep label="C" name="TOON" active={isProcessing} done={!!result} />
          <PipelineArrow />
          <PipelineStep label="D" name="Atuacao" active={isProcessing} done={!!result} />
        </div>

        {/* Grid 2x2 dos 4 Modulos */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <ModuleIngestion onProcess={handleProcess} isProcessing={isProcessing} />
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] text-muted-foreground font-sans">
            TOON Semantic Agent - Avaliacao Intermediaria IA Aplicada
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Mock Mode | Gramatica BNF v1.0 | ECLASS Simulated
          </p>
        </div>
      </footer>
    </div>
  )
}

function PipelineStep({ label, name, active, done }: { label: string; name: string; active: boolean; done: boolean }) {
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
      <span className="hidden text-[10px] text-muted-foreground sm:inline font-sans">{name}</span>
    </div>
  )
}

function PipelineArrow() {
  return (
    <div className="flex h-[1px] w-4 bg-border sm:w-8" />
  )
}
