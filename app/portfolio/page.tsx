"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Zap,
  CheckCircle2,
  FileSearch,
  GitBranch,
  Shield,
  Layers,
  ArrowRight,
  Cpu,
  Globe,
} from "lucide-react"

const SERVICES = [
  {
    id: "generate",
    name: "Generate Semantic Model",
    description: "Converte dados técnicos brutos em AAS estruturado, mapeamento ECLASS e JSON/XML industrial.",
    endpoint: "POST /api/orchestrator",
    icon: Zap,
    plan: "Pro",
    features: ["AAS JSON", "ECLASS Mapping", "Node-RED Flow", "Export PDF"],
  },
  {
    id: "validate",
    name: "Validate Semantic Model",
    description: "Audita conformidade semântica de modelos AAS: estrutura, campos obrigatórios, consistência ECLASS.",
    endpoint: "POST /validate (futuro)",
    icon: CheckCircle2,
    plan: "Pro",
    features: ["Compliance Score", "Issues Report", "Sugestões de correção"],
  },
  {
    id: "orchestrate",
    name: "Orchestrate Multi-Asset",
    description: "Harmoniza múltiplos ativos: detecta conflitos semânticos, propõe modelo consolidado.",
    endpoint: "POST /orchestrate (futuro)",
    icon: Layers,
    plan: "Enterprise",
    features: ["Detecção de conflitos", "Modelo consolidado", "Data Space ready"],
  },
]

const PLANS = [
  { name: "Free", price: "€0", calls: "100/mês", color: "emerald" },
  { name: "Pro", price: "€49", calls: "10.000/mês", color: "primary" },
  { name: "Enterprise", price: "Custom", calls: "Ilimitado", color: "amber" },
]

export default function PortfolioPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Hero Portfólio */}
        <section className="border-b border-border bg-card/30">
          <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
            <div className="flex flex-col gap-4 text-center">
              <Badge className="mx-auto w-fit bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]">
                Semantic Orchestration Engine
              </Badge>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground font-sans">
                Portfólio de Serviços
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto font-sans">
                APIs e Node-RED para interoperabilidade semântica industrial. Geração, validação e orquestração de modelos AAS/ECLASS.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary text-primary-foreground">
                  <Link href="/agente">
                    Testar Agente
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link href="/">Documentação</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* APIs */}
        <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-lg font-bold text-foreground font-sans mb-6 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            APIs Disponíveis
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((svc) => {
              const Icon = svc.icon
              return (
                <Card key={svc.id} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-sans">{svc.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-[9px] font-mono">
                            {svc.plan}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                      {svc.description}
                    </p>
                    <div className="rounded border border-border bg-secondary/30 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                      {svc.endpoint}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {svc.features.map((f) => (
                        <span
                          key={f}
                          className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-mono"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Node-RED */}
        <section className="border-t border-border bg-card/20">
          <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
            <h2 className="text-lg font-bold text-foreground font-sans mb-6 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Node-RED Node
            </h2>
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-sans text-foreground font-medium">
                      node-red-contrib-semantic-agent
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      Nó oficial para integração com fluxos Node-RED. Envia variáveis via HTTP, recebe AAS/ECLASS/JSON.
                    </p>
                  </div>
                  <Badge className="w-fit bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                    Em desenvolvimento
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Planos */}
        <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
          <h2 className="text-lg font-bold text-foreground font-sans mb-6 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Planos
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card key={p.name} className="border-border bg-card">
                <CardContent className="p-5">
                  <p className="text-sm font-bold font-sans">{p.name}</p>
                  <p className="text-2xl font-bold text-primary font-mono mt-1">{p.price}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.calls}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Diferencial */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
            <h2 className="text-lg font-bold text-foreground font-sans mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Diferencial
            </h2>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed max-w-2xl">
              Não somos um gerador de JSON. Somos uma <strong className="text-foreground">camada de orquestração semântica</strong> para Data Spaces industriais — complementando os padrões VDMA, IDSA, AAS e ECLASS com automação baseada em IA.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-5xl flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] text-muted-foreground font-sans">
            Orquestrador Semântico Industrial — Projeto Acadêmico + Visão Comercial
          </p>
        </div>
      </footer>
    </div>
  )
}
