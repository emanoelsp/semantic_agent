"use client"

import { useState, useCallback, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { ModuleIngestion } from "@/components/module-ingestion"
import { ModuleReasoning } from "@/components/module-reasoning"
import { ModuleToon } from "@/components/module-toon"
import { ModuleModelagem } from "@/components/module-modelagem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Wifi, ChevronRight, ChevronLeft } from "lucide-react"
import type { ProcessingResult } from "@/lib/mock-data"

type AgentResult = ProcessingResult & {
  source?: "llm"
  interpretation?: string
  eclassCandidates?: Array<{ eclassId: string; target: string; unit: string }>
}

const STEPS = [
  { id: 1, name: "Dados", short: "1" },
  { id: 2, name: "Análise", short: "2" },
  { id: 3, name: "TOON", short: "3" },
  { id: 4, name: "Modelagem", short: "4" },
]

export default function AgentePage() {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [lastProcessingTime, setLastProcessingTime] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setGeminiConfigured(d.geminiConfigured === true))
      .catch(() => setGeminiConfigured(false))
  }, [])

  const handleProcess = useCallback(
    async (
      inputData: string,
      inputType: "brownfield" | "greenfield",
      description?: string,
      datatype?: string
    ) => {
      setIsProcessing(true)
      setResult(null)
      setError(null)

      try {
        const startTime = Date.now()
        const body: Record<string, string> = { inputData, inputType }
        if (description?.trim()) body.description = description.trim()
        if (datatype?.trim()) body.datatype = datatype.trim()
        const response = await fetch("/api/orchestrator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          const msg = typeof data?.error === "string" ? data.error : `Erro ${response.status}: ${response.statusText}`
          setError(msg)
          return
        }

        setResult(data as AgentResult)
        setLastProcessingTime(Date.now() - startTime)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro de conexão"
        setError(msg)
        console.error("Erro:", err)
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const handleProcessDatasheet = useCallback(async (file: File) => {
    setIsProcessing(true)
    setResult(null)
    setError(null)

    try {
      const startTime = Date.now()
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/extract-datasheet", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const msg = typeof data?.error === "string" ? data.error : `Erro ${response.status}: ${response.statusText}`
        setError(msg)
        return
      }

      setResult(data as AgentResult)
      setLastProcessingTime(Date.now() - startTime)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de conexão"
      setError(msg)
      console.error("Erro:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const canAdvance = () => {
    if (step === 1) return !!result && !isProcessing
    return !!result
  }

  const handleNext = () => {
    if (step < 4 && canAdvance()) setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 lg:px-6">
          <div className="mx-auto max-w-3xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground font-sans">
                Agente Semântico Interativo
              </h1>
              <p className="text-xs text-muted-foreground font-sans">
                4 páginas sequenciais: Dados → Análise → TOON → Modelagem Funcional
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
                  isProcessing ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                <Activity className={`h-3 w-3 ${isProcessing ? "animate-pulse" : ""}`} />
                {isProcessing ? "Processando" : "Idle"}
              </Badge>
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 font-mono text-xs bg-primary/20 text-primary border border-primary/30"
              >
                <Wifi className="h-3 w-3" />
                LLM
              </Badge>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="border-b border-border px-4 py-3 lg:px-6 bg-card/50">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => result && setStep(s.id)}
                  disabled={!result && s.id > 1}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    step === s.id
                      ? "bg-primary/20 text-primary"
                      : s.id <= step || result
                        ? "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        : "text-muted-foreground/50 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold font-mono ${
                      step === s.id ? "bg-primary text-primary-foreground" : "bg-secondary border border-border"
                    }`}
                  >
                    {s.short}
                  </span>
                  <span className="hidden sm:inline font-sans">{s.name}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border max-w-8" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
          <div className="mx-auto max-w-3xl flex flex-col gap-6">
            {/* Página 1: Dados */}
            {step === 1 && (
              <>
                {geminiConfigured === false && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-950/30 p-3 text-sm text-amber-400">
                    API do Gemini não configurada ou indisponível. Configure GEMINI_API_KEY no .env.local ou na Vercel.
                  </div>
                )}
                <ModuleIngestion
                  onProcess={handleProcess}
                  onProcessDatasheet={handleProcessDatasheet}
                  isProcessing={isProcessing}
                />
                {error && (
                  <div className="rounded-md border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                {result && !isProcessing && (
                  <Button onClick={handleNext} className="w-full sm:w-auto">
                    Avançar para Análise
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Página 2: Análise */}
            {step === 2 && (
              <>
                <ModuleReasoning
                  steps={result?.reasoningSteps || []}
                  isProcessing={false}
                  confidence={result?.confidence ?? null}
                  interpretation={result?.interpretation}
                  eclassCandidates={result?.eclassCandidates}
                  toonMapping={result?.toonMapping}
                  onSelectEclass={(eclassId, target, unit) => {
                    if (!result) return
                    setResult({
                      ...result,
                      toonMapping: {
                        ...result.toonMapping,
                        eclassId,
                        target,
                        unit: unit ?? result.toonMapping.unit,
                      },
                      aasPreview: {
                        ...result.aasPreview,
                        semanticId: eclassId,
                      },
                      confidence: 0.75,
                    })
                  }}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleNext}>
                    Avançar para TOON
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Página 3: TOON */}
            {step === 3 && (
              <>
                <ModuleToon
                  toonOutput={result?.toonOutput || null}
                  isProcessing={false}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleNext}>
                    Avançar para Modelagem
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Página 4: Modelagem */}
            {step === 4 && (
              <>
                <ModuleModelagem result={result} />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleBack}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="border-t border-border px-6 py-3">
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground font-sans">
              TOON Semantic Agent - Avaliação Intermediária IA Generativa
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              LLM (Gemini) | Gramática BNF v1.0 | ECLASS
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
