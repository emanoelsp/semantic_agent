"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Database, Globe, ArrowRight } from "lucide-react"
import { EXAMPLE_TAGS } from "@/lib/mock-data"

interface ModuleIngestionProps {
  onProcess: (data: string, type: "brownfield" | "greenfield") => void
  isProcessing: boolean
}

export function ModuleIngestion({ onProcess, isProcessing }: ModuleIngestionProps) {
  const [inputValue, setInputValue] = useState("")
  const [inputType, setInputType] = useState<"brownfield" | "greenfield">("brownfield")

  const handleSubmit = () => {
    if (inputValue.trim() && !isProcessing) {
      onProcess(inputValue.trim(), inputType)
    }
  }

  const handleExampleClick = (value: string, type: "brownfield" | "greenfield") => {
    setInputValue(value)
    setInputType(type)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
              Modulo A: Percepcao e Ingestao
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-01/03
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Toggle Brownfield/Greenfield */}
        <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
          <button
            onClick={() => setInputType("brownfield")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors font-sans ${
              inputType === "brownfield"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-3 w-3" />
            Brownfield
          </button>
          <button
            onClick={() => setInputType("greenfield")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors font-sans ${
              inputType === "greenfield"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3 w-3" />
            Greenfield
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder={inputType === "brownfield" ? "Ex: DB10.W2" : "Ex: /temp/v1"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Exemplos */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground font-sans">
            Exemplos
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_TAGS.map((example) => (
              <button
                key={example.value}
                onClick={() => handleExampleClick(example.value, example.type)}
                disabled={isProcessing}
                className="rounded border border-border bg-secondary/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 font-mono"
              >
                {example.value}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-md border border-border bg-secondary/30 p-2.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground font-sans">
            {inputType === "brownfield"
              ? "Insira uma tag de PLC (Siemens S7, Allen-Bradley, etc.) ou identificador de sensor legado para mapeamento semantico."
              : "Insira um endpoint de API REST, MQTT topic ou GraphQL query de um CPS inteligente para harmonizacao."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
