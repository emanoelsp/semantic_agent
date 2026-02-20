"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, FileJson, GitBranch, Download, Copy, CheckCircle2 } from "lucide-react"
import type { ProcessingResult } from "@/lib/mock-data"
import { generateAASJson, generateNodeRedFlow } from "@/lib/mock-data"

interface ModuleActuationProps {
  result: ProcessingResult | null
  isProcessing: boolean
}

export function ModuleActuation({ result, isProcessing }: ModuleActuationProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("aas")

  const aasJson = result ? generateAASJson(result) : null
  const nodeRedFlow = result ? generateNodeRedFlow(result) : null

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <CardTitle className="text-sm font-semibold text-card-foreground font-sans">
              Módulo D: Atuação e Export
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border border-border text-[10px] font-mono">
            RF-10/11
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!result && !isProcessing && (
          <div className="flex min-h-[180px] items-center justify-center rounded-md border border-border bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground italic font-sans">
              Aguardando geração TOON validada do Módulo C...
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="flex min-h-[180px] items-center justify-center rounded-md border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground font-sans">
                Aguardando resultado do pipeline...
              </span>
            </div>
          </div>
        )}

        {result && !isProcessing && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="aas" className="flex items-center gap-1.5 text-xs font-sans data-[state=active]:bg-card data-[state=active]:text-foreground">
                <FileJson className="h-3 w-3" />
                AAS JSON
              </TabsTrigger>
              <TabsTrigger value="nodered" className="flex items-center gap-1.5 text-xs font-sans data-[state=active]:bg-card data-[state=active]:text-foreground">
                <GitBranch className="h-3 w-3" />
                Node-RED
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aas" className="mt-3">
              <div className="flex flex-col gap-2">
                <div className="max-h-[160px] overflow-auto rounded-md border border-border bg-background p-3">
                  <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                    {aasJson}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                    onClick={() => aasJson && handleCopy(aasJson, "aas")}
                  >
                    {copied === "aas" ? (
                      <CheckCircle2 className="mr-1.5 h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="mr-1.5 h-3 w-3" />
                    )}
                    {copied === "aas" ? "Copiado" : "Copiar"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => aasJson && handleDownload(aasJson, `aas-${result.toonMapping.source}.json`)}
                  >
                    <Download className="mr-1.5 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nodered" className="mt-3">
              <div className="flex flex-col gap-2">
                <div className="max-h-[160px] overflow-auto rounded-md border border-border bg-background p-3">
                  <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                    {nodeRedFlow}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                    onClick={() => nodeRedFlow && handleCopy(nodeRedFlow, "nodered")}
                  >
                    {copied === "nodered" ? (
                      <CheckCircle2 className="mr-1.5 h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="mr-1.5 h-3 w-3" />
                    )}
                    {copied === "nodered" ? "Copiado" : "Copiar"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => nodeRedFlow && handleDownload(nodeRedFlow, `nodered-${result.toonMapping.source}.json`)}
                  >
                    <Download className="mr-1.5 h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Mapping Summary */}
        {result && !isProcessing && (
          <div className="rounded-md border border-border bg-secondary/30 p-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground font-sans">Fonte</span>
                <span className="text-[10px] text-foreground font-mono">{result.toonMapping.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground font-sans">ECLASS</span>
                <span className="text-[10px] text-primary font-mono">{result.toonMapping.eclassId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground font-sans">Action</span>
                <span className="text-[10px] text-foreground font-mono">{result.toonMapping.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground font-sans">Unidade</span>
                <span className="text-[10px] text-foreground font-mono">{result.toonMapping.unit}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
