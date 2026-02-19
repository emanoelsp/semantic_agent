"use client"

import { Badge } from "@/components/ui/badge"
import { Activity, Cpu, Wifi } from "lucide-react"

interface DashboardHeaderProps {
  isProcessing: boolean
  lastProcessingTime?: number
}

export function DashboardHeader({ isProcessing, lastProcessingTime }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground font-sans">
            TOON Semantic Agent
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            AAS Cognitive Orchestrator v0.1
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
          <Activity className={`h-3 w-3 ${isProcessing ? "animate-pulse" : ""}`} />
          {isProcessing ? "Processando" : "Idle"}
        </Badge>
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 font-mono text-xs"
        >
          <Wifi className="h-3 w-3" />
          Mock Mode
        </Badge>
      </div>
    </header>
  )
}
