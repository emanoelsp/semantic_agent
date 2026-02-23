"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layers, FileJson, GitBranch, FileDown, Download, ChevronDown, ChevronRight, Box } from "lucide-react"
import type { ProcessingResult } from "@/lib/mock-data"
import { generateAASJson, generateNodeRedFlow } from "@/lib/mock-data"
import { generateModelagemFuncionalPDF } from "@/lib/pdf-modelagem"

type ResultWithDatasheet = ProcessingResult & {
  aasJson?: object
  datasheetMappings?: Array<{ source: string; target: string; eclassId: string; description?: string }>
}

interface ModuleModelagemProps {
  result: ResultWithDatasheet | null
}

// Bloco visual AAS expansível
function AASBlockVisual({ result }: { result: ResultWithDatasheet }) {
  const assetName = (result.aasPreview.idShort as string) || "Asset"
  const [expanded, setExpanded] = useState(true)

  const submodelElements =
    "datasheetMappings" in result && result.datasheetMappings
      ? [
          { name: "OperationalVariables", type: "Submodel" as const },
          ...result.datasheetMappings.map((m) => ({
            name: m.description ?? m.target,
            type: "Property" as const,
            eclass: m.eclassId,
            unit: undefined as string | undefined,
          })),
        ]
      : [
          { name: "TechnicalData", type: "Submodel" as const },
          { name: result.toonMapping.target, type: "Property" as const, eclass: result.toonMapping.eclassId, unit: result.toonMapping.unit },
        ]

  return (
    <div className="rounded-lg border border-primary/30 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 bg-primary/10 hover:bg-primary/15 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
        <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold font-sans text-foreground">{assetName}</span>
        <Badge variant="secondary" className="ml-auto text-[9px] font-mono shrink-0">AAS</Badge>
      </button>
          {expanded && (
        <div className="border-t border-border p-2 space-y-1">
          {submodelElements.map((el, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-border bg-background/80 px-2 py-1.5">
              <Box className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] font-mono text-foreground">{el.name}</span>
              {"eclass" in el && (
                <>
                  <span className="text-[9px] text-muted-foreground font-mono">ECLASS: {el.eclass}</span>
                  {"unit" in el && el.unit && (
                    <Badge variant="outline" className="text-[8px] font-mono ml-auto">{el.unit}</Badge>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Ilustração visual do fluxo Node-RED
function NodeRedFlowIllustration({ result }: { result: ProcessingResult }) {
  const nodes = [
    { id: "in", label: result.inputType === "brownfield" ? "S7 / PLC" : "HTTP", color: "bg-blue-500/20 border-blue-500/40" },
    { id: "fn", label: "TOON Transform", color: "bg-primary/20 border-primary/40" },
    { id: "out", label: "AAS Registry", color: "bg-emerald-500/20 border-emerald-500/40" },
  ]
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3">
        Fluxo gerado (exemplo)
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-2">
            <div className={`rounded-md border px-2 py-1.5 ${n.color}`}>
              <span className="text-[10px] font-mono">{n.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground mt-2 font-sans">
        Leitura de {result.toonMapping.source} → mapeamento TOON → publicação AAS.
      </p>
    </div>
  )
}

export function ModuleModelagem({ result }: ModuleModelagemProps) {
  if (!result) return null

  const aasJsonStr =
    "aasJson" in result && result.aasJson
      ? JSON.stringify(result.aasJson, null, 2)
      : generateAASJson(result)
  const nodeRedFlow = generateNodeRedFlow(result)

  const handleDownloadPDF = () => {
    generateModelagemFuncionalPDF(result)
  }

  const handleDownloadNodeRed = () => {
    const blob = new Blob([nodeRedFlow], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nodered-${result.toonMapping.source.replace(/[^a-zA-Z0-9]/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
                Página 4: Modelagem Funcional
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-sans">
                AAS baseado em ECLASS + Node-RED
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-10/11
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
          Modelagem funcional do ativo com Asset Administration Shell (AAS) baseada em ECLASS
          e fluxo Node-RED para integração. Formato TOON validado.
        </p>

        {/* Bloco visual AAS */}
        <div className="rounded-md border border-border bg-secondary/20 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2">
            Modelagem funcional do ativo (visual)
          </p>
          <AASBlockVisual result={result} />
        </div>

        <Tabs defaultValue="aas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger value="aas" className="flex items-center gap-1.5 text-xs font-sans">
              <FileJson className="h-3 w-3" />
              AAS (ECLASS)
            </TabsTrigger>
            <TabsTrigger value="nodered" className="flex items-center gap-1.5 text-xs font-sans">
              <GitBranch className="h-3 w-3" />
              Node-RED
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aas" className="mt-3 space-y-3">
            <div className="max-h-[180px] overflow-auto rounded-md border border-border bg-background p-3">
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                {aasJsonStr}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="nodered" className="mt-3 space-y-3">
            <NodeRedFlowIllustration result={result} />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadNodeRed}
              className="w-fit"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Baixar JSON Node-RED
            </Button>
            <div className="max-h-[140px] overflow-auto rounded-md border border-border bg-background p-3">
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                {nodeRedFlow}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {/* Resumo do mapeamento */}
        <div className="rounded-md border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2">
            Resumo TOON
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
            <div><span className="text-muted-foreground">Fonte:</span> {result.toonMapping.source}</div>
            <div><span className="text-muted-foreground">ECLASS:</span> {result.toonMapping.eclassId}</div>
            <div><span className="text-muted-foreground">Ação:</span> {result.toonMapping.action}</div>
            <div><span className="text-muted-foreground">Unidade:</span> {result.toonMapping.unit}</div>
          </div>
        </div>

        <Button
          onClick={handleDownloadPDF}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Baixar PDF - Modelagem Funcional do Ativo (AAS, ECLASS, TOON)
        </Button>
      </CardContent>
    </Card>
  )
}
