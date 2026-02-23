"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Database, Globe, ArrowRight, FileText } from "lucide-react"
import { EXAMPLE_TAGS } from "@/lib/mock-data"

interface ModuleIngestionProps {
  onProcess: (
    data: string,
    type: "brownfield" | "greenfield",
    description?: string,
    datatype?: string
  ) => void
  onProcessDatasheet?: (file: File) => Promise<void>
  isProcessing: boolean
}

export function ModuleIngestion({ onProcess, onProcessDatasheet, isProcessing }: ModuleIngestionProps) {
  const [inputValue, setInputValue] = useState("")
  const [inputDescription, setInputDescription] = useState("")
  const [inputDatatype, setInputDatatype] = useState("")
  const [inputType, setInputType] = useState<"brownfield" | "greenfield">("brownfield")
  const [mode, setMode] = useState<"manual" | "datasheet">("manual")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (inputValue.trim() && !isProcessing) {
      onProcess(
        inputValue.trim(),
        inputType,
        inputDescription.trim() || undefined,
        inputDatatype.trim() || undefined
      )
    }
  }

  const handleDatasheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onProcessDatasheet && !isProcessing) {
      await onProcessDatasheet(file)
      e.target.value = ""
    }
  }

  const handleExampleClick = (
    value: string,
    type: "brownfield" | "greenfield",
    description?: string,
    datatype?: string
  ) => {
    setInputValue(value)
    setInputType(type)
    setInputDescription(description ?? "")
    setInputDatatype(datatype ?? "")
  }

  const [loadingMessage, setLoadingMessage] = useState(0)
  useEffect(() => {
    if (!isProcessing) {
      setLoadingMessage(0)
      return
    }
    const messages =
      mode === "datasheet"
        ? ["Carregando dados...", "Extraindo dados do PDF...", "Mapeando variáveis...", "Gerando AAS..."]
        : ["Carregando dados...", "Enviando para análise...", "Aguardando resposta do agente..."]
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % messages.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [isProcessing, mode])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Upload className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
              Página 1: Preenchimento de Dados
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-01/03
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Toggle Manual / Datasheet PDF */}
        <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors font-sans ${
              mode === "manual" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-3 w-3" />
            Tag / Endpoint
          </button>
          <button
            onClick={() => setMode("datasheet")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors font-sans ${
              mode === "datasheet" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3 w-3" />
            Datasheet PDF
          </button>
        </div>

        {mode === "manual" ? (
          <>
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
            placeholder={inputType === "brownfield" ? "Ex: DB1.W0" : "Ex: /temp/v1"}
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
            {isProcessing ? "..." : "Processar"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Descrição opcional (Brownfield) - enriquece o mapeamento semântico */}
        {inputType === "brownfield" && (
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Descrição (ex: Comando de marcha da esteira)"
              value={inputDescription}
              onChange={(e) => setInputDescription(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground font-sans text-sm"
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <select
                value={inputDatatype}
                onChange={(e) => setInputDatatype(e.target.value)}
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm font-mono text-foreground"
                disabled={isProcessing}
              >
                <option value="">Tipo (opcional)</option>
                <option value="BOOL">BOOL</option>
                <option value="INT">INT</option>
                <option value="REAL">REAL</option>
                <option value="DINT">DINT</option>
                <option value="WORD">WORD</option>
              </select>
            </div>
          </div>
        )}

        {/* Exemplos */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground font-sans">
            Exemplos
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_TAGS.map((example) => (
              <button
                key={example.value}
                onClick={() =>
                  handleExampleClick(
                    example.value,
                    example.type,
                    "description" in example ? example.description : undefined,
                    "datatype" in example ? example.datatype : undefined
                  )
                }
                disabled={isProcessing}
                className="rounded border border-border bg-secondary/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 font-mono"
                title={"description" in example && example.description ? example.description : undefined}
              >
                {example.label ?? example.value}
              </button>
            ))}
          </div>
        </div>

        {/* Efeito de carregamento (modo manual) */}
        {isProcessing && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 animate-in fade-in duration-200">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary font-sans">
                {["Carregando dados...", "Enviando para análise...", "Aguardando resposta do agente..."][loadingMessage]}
              </p>
              <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                Analisando via LLM...
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="rounded-md border border-border bg-secondary/30 p-2.5">
          <p className="text-[11px] leading-relaxed text-muted-foreground font-sans">
            {inputType === "brownfield"
              ? "Tag de PLC (Siemens S7, Allen-Bradley) ou sensor legado. Recomendado: informe a descrição semântica (ex: Comando de marcha da esteira) para mapeamento ECLASS confiável. Sem contexto, o agente pode retornar UNKNOWN."
              : "Endpoint de API REST, MQTT topic ou GraphQL query de um CPS inteligente para harmonização."}
          </p>
        </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {isProcessing && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 animate-in fade-in duration-200">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-medium text-primary font-sans">
                    {["Carregando dados...", "Extraindo dados do PDF...", "Mapeando variáveis...", "Gerando AAS..."][loadingMessage]}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                    Processando datasheet com Gemini...
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleDatasheetUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || !onProcessDatasheet}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Carregar Datasheet PDF
            </Button>
            <p className="text-[11px] text-muted-foreground font-sans">
              O agente extrai variáveis do datasheet e prossegue com a análise semântica.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
