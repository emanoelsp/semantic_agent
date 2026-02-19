"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import type { ReasoningStep } from "@/lib/mock-data"

interface ModuleReasoningProps {
  steps: ReasoningStep[]
  isProcessing: boolean
  confidence: number | null
}

export function ModuleReasoning({ steps, isProcessing, confidence }: ModuleReasoningProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0)

  // Animacao progressiva dos steps
  useEffect(() => {
    if (steps.length === 0) {
      setVisibleSteps(0)
      return
    }

    setVisibleSteps(0)
    const interval = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev >= steps.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 400)

    return () => clearInterval(interval)
  }, [steps])

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return "text-emerald-400"
    if (conf >= 0.8) return "text-amber-400"
    return "text-red-400"
  }

  const getConfidenceBg = (conf: number) => {
    if (conf >= 0.9) return "bg-emerald-950/50 border-emerald-500/20"
    if (conf >= 0.8) return "bg-amber-950/50 border-amber-500/20"
    return "bg-red-950/50 border-red-500/20"
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
              Modulo B: Raciocinio Semantico
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-04/06
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Reasoning Steps Log */}
        <div className="flex flex-col gap-1.5 rounded-md border border-border bg-secondary/30 p-3 min-h-[180px] max-h-[220px] overflow-y-auto">
          {steps.length === 0 && !isProcessing && (
            <p className="text-xs text-muted-foreground italic font-sans">
              Aguardando dados de entrada do Modulo A...
            </p>
          )}

          {isProcessing && steps.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="font-sans">Inicializando pipeline de raciocinio...</span>
            </div>
          )}

          {steps.slice(0, visibleSteps).map((step) => (
            <div
              key={step.step}
              className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <span className="shrink-0 text-[10px] text-muted-foreground font-mono w-8">
                [{step.timestamp}]
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-primary font-sans">
                  {step.action}
                </span>
                <span className="text-[11px] leading-relaxed text-muted-foreground font-sans">
                  {step.detail}
                </span>
              </div>
            </div>
          ))}

          {isProcessing && visibleSteps < steps.length && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="font-sans">Processando...</span>
            </div>
          )}
        </div>

        {/* Confidence Score */}
        {confidence !== null && visibleSteps >= steps.length && (
          <div className={`flex items-center justify-between rounded-md border p-3 ${getConfidenceBg(confidence)}`}>
            <div className="flex items-center gap-2">
              {confidence >= 0.85 ? (
                <CheckCircle2 className={`h-4 w-4 ${getConfidenceColor(confidence)}`} />
              ) : (
                <AlertTriangle className={`h-4 w-4 ${getConfidenceColor(confidence)}`} />
              )}
              <span className="text-xs font-medium text-foreground font-sans">
                Confidence Score
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}

        {confidence !== null && confidence < 0.85 && visibleSteps >= steps.length && (
          <p className="text-[10px] text-amber-400/80 font-sans">
            Confidence abaixo de 85%. Recomenda-se validacao humana (Human-in-the-Loop).
          </p>
        )}
      </CardContent>
    </Card>
  )
}
