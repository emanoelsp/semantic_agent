"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, CheckCircle2, XCircle, Shield } from "lucide-react"
import { parseToon } from "@/lib/toon-parser"
import {
  parseToonOrchestrator,
  toDisplayParseResult,
} from "@/lib/toon-orchestrator-parser"
import type { ToonFormattedSegment } from "@/lib/toon-parser"

interface ModuleToonProps {
  toonOutput: string | null
  isProcessing: boolean
}

const SEGMENT_COLORS: Record<ToonFormattedSegment["type"], string> = {
  keyword: "text-primary font-bold",
  operator: "text-muted-foreground",
  string: "text-emerald-400",
  identifier: "text-amber-400",
  error: "text-red-400 underline decoration-wavy",
  bracket: "text-muted-foreground font-bold",
}

export function ModuleToon({ toonOutput, isProcessing }: ModuleToonProps) {
  const parseResult = toonOutput
    ? toonOutput.includes("⟨")
      ? toDisplayParseResult(parseToonOrchestrator(toonOutput))
      : parseToon(toonOutput)
    : null

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
              Página 3: Geração TOON
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-07/09
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* TOON Code Display */}
        <div className="rounded-md border border-border bg-background p-4 min-h-[80px] flex items-center">
          {!toonOutput && !isProcessing && (
            <p className="text-xs text-muted-foreground italic font-sans">
              Aguardando resultado da Página 2...
            </p>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground font-sans">
                Gerando tokens TOON...
              </span>
            </div>
          )}

          {parseResult && !isProcessing && (
            <code className="text-sm font-mono leading-relaxed break-all">
              {parseResult.formatted.map((segment, i) => (
                <span key={i} className={SEGMENT_COLORS[segment.type]}>
                  {segment.text}
                </span>
              ))}
            </code>
          )}
        </div>

        {/* BNF Validation Status */}
        {parseResult && !isProcessing && (
          <>
            <div className={`flex items-center justify-between rounded-md border p-3 ${
              parseResult.valid
                ? "bg-emerald-950/50 border-emerald-500/20"
                : "bg-red-950/50 border-red-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 ${parseResult.valid ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-xs font-medium text-foreground font-sans">
                  Validação BNF
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {parseResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-xs font-bold font-mono ${parseResult.valid ? "text-emerald-400" : "text-red-400"}`}>
                  {parseResult.valid ? "VÁLIDO" : "INVÁLIDO"}
                </span>
              </div>
            </div>

            {/* Token Breakdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground font-sans">
                Tokens Decodificados
              </span>
              <div className="flex flex-col gap-1">
                {parseResult.tokens.map((token) => (
                  <div
                    key={token.type}
                    className="flex items-center justify-between rounded border border-border bg-secondary/30 px-2.5 py-1.5"
                  >
                    <span className="text-[11px] font-medium text-primary font-mono">
                      {token.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[180px]">
                      {token.value}
                    </span>
                    {token.valid ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Grammar Reference */}
            <div className="rounded-md border border-border bg-secondary/30 p-2.5">
              <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                {'<TOON> ::= MAP{ <SRC> | <TGT> | <ACTION> }'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
