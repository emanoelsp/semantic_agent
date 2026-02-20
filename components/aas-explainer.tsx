"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Box,
  Layers,
  FileJson,
  Globe,
  ChevronDown,
  ChevronUp,
  Database,
  Network,
} from "lucide-react"

export function AASExplainer() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-primary/20 bg-card">
      <CardContent className="p-0">
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between p-4 lg:p-5 text-left hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-sans">
                O que é AAS? (Asset Administration Shell)
              </h3>
              <p className="text-[10px] text-muted-foreground font-sans">
                Clique para entender o padrao que este agente automatiza
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border border-primary/20 font-mono text-[9px]">
              IEC 63278
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-border px-4 py-4 lg:px-5 lg:py-5 flex flex-col gap-5">
            {/* O que e */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                O <span className="text-foreground font-medium">Asset Administration Shell (AAS)</span>{" "}
                é o padrão internacional (IEC 63278 / Platform Industrie 4.0) que cria um{" "}
                <span className="text-foreground font-medium">gêmeo digital padronizado</span>{" "}
                para qualquer ativo industrial -- desde um sensor de temperatura até uma linha
                de produção completa.
              </p>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Pense no AAS como o <span className="text-foreground font-medium">&quot;passaporte digital&quot;</span>{" "}
                de uma máquina: ele contém todas as informações técnicas, operacionais e
                semânticas de forma que qualquer outro sistema na rede consiga entender
                automaticamente.
              </p>
            </div>

            {/* Estrutura Visual do AAS */}
            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3">
                Estrutura de um AAS
              </p>
              <div className="flex flex-col gap-2">
                {/* AAS Shell */}
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-bold text-primary font-sans">
                      Asset Administration Shell (AAS)
                    </span>
                  </div>

                  {/* Asset Information */}
                  <div className="ml-4 mb-2 rounded-md border border-border bg-card p-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-foreground font-sans">
                        Asset Information
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-sans ml-5">
                      ID global, tipo (Instance/Type), fabricante
                    </p>
                  </div>

                  {/* Submodels */}
                  <div className="ml-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-foreground font-sans">
                        Submodels (Submodelos)
                      </span>
                    </div>

                    {[
                      { name: "TechnicalData", desc: "Propriedades técnicas (temperatura, velocidade, etc.)", highlight: true },
                      { name: "Nameplate", desc: "Dados de placa (fabricante, modelo, serial)" },
                      { name: "OperationalData", desc: "Dados operacionais em tempo real" },
                      { name: "Documentation", desc: "Manuais, certificados, datasheets" },
                    ].map((sm) => (
                      <div
                        key={sm.name}
                        className={`ml-5 rounded border p-2 ${
                          sm.highlight
                            ? "border-amber-500/20 bg-amber-950/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <span className={`text-[10px] font-bold font-mono ${sm.highlight ? "text-amber-400" : "text-muted-foreground"}`}>
                          {sm.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-sans ml-1">
                          -- {sm.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Concept Descriptions */}
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold text-foreground font-sans">
                      Concept Descriptions (ECLASS)
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans ml-6">
                    Dicionário semântico: cada propriedade referencia um IRDI ECLASS que
                    define universalmente o que ela significa (ex: 0173-1#02-BAA123 = Velocity)
                  </p>
                </div>
              </div>
            </div>

            {/* Por que importa */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-secondary/30 p-3 flex flex-col gap-1">
                <Globe className="h-4 w-4 text-primary mb-1" />
                <span className="text-[10px] font-bold text-foreground font-sans">Interoperabilidade</span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  Qualquer sistema que &quot;fala AAS&quot; entende os dados sem configuração manual.
                </span>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 flex flex-col gap-1">
                <Network className="h-4 w-4 text-amber-400 mb-1" />
                <span className="text-[10px] font-bold text-foreground font-sans">Data Spaces</span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  AAS e a base para participar de Data Spaces industriais (Catena-X, GAIA-X).
                </span>
              </div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 flex flex-col gap-1">
                <Layers className="h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[10px] font-bold text-foreground font-sans">Digital Twin</span>
                <span className="text-[10px] text-muted-foreground font-sans">
                  O AAS é o formato padronizado para representação de gêmeos digitais industriais.
                </span>
              </div>
            </div>

            <p className="text-xs text-primary/80 font-sans leading-relaxed bg-primary/5 border border-primary/10 rounded-md p-3">
              <span className="font-bold text-foreground">Este agente automatiza a criação de AAS:</span>{" "}
              Ao invés de um engenheiro mapear manualmente cada propriedade de cada equipamento
              para o formato AAS (processo que pode levar horas por ativo), o agente TOON faz
              isso automaticamente usando inferencia semantica via LLM.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
