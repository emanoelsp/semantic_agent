"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layers, FileJson, GitBranch, FileDown, Download } from "lucide-react"
import type { ProcessingResult } from "@/lib/mock-data"
import { generateAASJson, generateNodeRedFlow } from "@/lib/mock-data"
import { generateModelagemFuncionalPDF } from "@/lib/pdf-modelagem"

interface ModuleModelagemProps {
  result: ProcessingResult | null
}

export function ModuleModelagem({ result }: ModuleModelagemProps) {
  if (!result) return null

  const aasJson = generateAASJson(result)
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

          <TabsContent value="aas" className="mt-3">
            <div className="max-h-[220px] overflow-auto rounded-md border border-border bg-background p-3">
              <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                {aasJson}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="nodered" className="mt-3">
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadNodeRed}
                className="w-fit"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Baixar JSON Node-RED
              </Button>
              <div className="max-h-[180px] overflow-auto rounded-md border border-border bg-background p-3">
                <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {nodeRedFlow}
                </pre>
              </div>
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
