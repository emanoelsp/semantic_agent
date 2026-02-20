import Image from "next/image"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import {
  ArrowRight,
  Factory,
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Database,
  Globe,
  BrainCircuit,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section com Imagem */}
        <section className="relative overflow-hidden">
          <div className="relative w-full aspect-[16/7] max-h-[420px]">
            <Image
              src="/images/residencia-ia.png"
              alt="Residência em Inteligência Artificial - FIESC, UniSENAI, Instituto SENAI"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
          </div>

          {/* Overlay Course Info */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 lg:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-xl border border-border bg-card/90 backdrop-blur-md p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-2">
                    <Badge className="w-fit bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]">
                      Avaliação Intermediária
                    </Badge>
                    <h1 className="text-xl lg:text-2xl font-bold text-foreground font-sans text-balance">
                      Agente Cognitivo para Instanciação Automatizada de AAS
                    </h1>
                    <p className="text-sm text-muted-foreground font-sans">
                      via Alinhamento Semântico Restrito (TOON)
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-sans lg:text-right shrink-0">
                    <p>
                      <span className="text-foreground font-medium">Curso:</span>{" "}
                      Pós-graduação em IA Aplicada
                    </p>
                    <p>
                      <span className="text-foreground font-medium">Unidade Curricular:</span>{" "}
                      IA Generativa
                    </p>
                    <p>
                      <span className="text-foreground font-medium">Docente:</span>{" "}
                      Douglas Coimbra de Andrade
                    </p>
                    <p>
                      <span className="text-foreground font-medium">Estudante:</span>{" "}
                      Emanoel Spanhol
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secao: O Problema */}
        <section className="mx-auto max-w-5xl px-4 py-12 lg:px-6 lg:py-16">
          <div className="flex flex-col gap-8">
            {/* Titulo da secao */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                  Contextualização
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-foreground font-sans text-center text-balance">
                Do Sintático ao Semântico: O Gargalo da Indústria 4.0
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto font-sans leading-relaxed">
                A promessa da Indústria 4.0 é a interoperabilidade universal. Padrões como o
                Asset Administration Shell (AAS) e dicionários semânticos como ECLASS existem
                para isso. Mas a realidade no chão de fábrica é bem diferente.
              </p>
            </div>

            {/* Diagrama Visual: Sintatico -> Semantico */}
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="flex flex-col gap-6">
                {/* Nivel 1: Sintatico */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      Nível Sintático (Onde estamos)
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Hoje, equipamentos industriais falam "línguas" diferentes. Um PLC Siemens
                    usa tags como <code className="text-primary font-mono">DB10.W2</code>, um
                    sensor IoT expõe <code className="text-primary font-mono">/api/temp/v1</code>.
                    Cada dado é sintaticamente correto dentro do seu sistema, mas não carrega
                    significado universal. Um humano precisa interpretar cada tag manualmente.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["DB10.W2", "DB1.DBX0.1", "Mtr_Tmp_01", "%MW100"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-amber-500/20 bg-amber-950/30 px-2.5 py-1 text-[11px] text-amber-400 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="rounded border border-border bg-secondary/30 px-2.5 py-1 text-[11px] text-muted-foreground font-mono italic">
                      {"= ???"}
                    </span>
                  </div>
                </div>

                {/* Seta de transição */}
                <div className="flex items-center gap-3 px-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-primary/30" />
                  <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                    <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary font-mono">
                      AGENTE COGNITIVO TOON
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-emerald-500/30" />
                </div>

                {/* Nivel 2: Semantico */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      Nível Semântico (Onde queremos chegar)
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Com alinhamento semântico, cada dado carrega seu significado universal.{" "}
                    <code className="text-primary font-mono">DB10.W2</code> se torna{" "}
                    <code className="text-emerald-400 font-mono">ECLASS:0173-1#02-BAA123 (Velocity)</code>.
                    Qualquer sistema no Data Space entende automaticamente o que esse dado
                    representa, sua unidade e como utilizá-lo.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { tag: "Velocity (m/s)", id: "0173-1#02-BAA123" },
                      { tag: "Operating Status", id: "0173-1#02-BAF321" },
                      { tag: "Temperature (C)", id: "0173-1#02-AAB713" },
                    ].map((item) => (
                      <span
                        key={item.id}
                        className="rounded border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-400 font-mono"
                      >
                        {item.tag}
                        <span className="ml-1 text-emerald-400/50 text-[9px]">{item.id}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cards: Dois Cenarios */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Brownfield */}
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950/50 text-amber-400 border border-amber-500/20">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Cenário Brownfield
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-sans">Legado Industrial</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Milhares de equipamentos operam com protocolos brutos (Modbus, Profinet) e
                    tags criptográficas como <code className="text-primary font-mono">DB1.DBX0.1</code>.
                    Exigem engenharia manual intensiva                     para mapeamento semântico. Um engenheiro
                    pode levar horas para mapear um único ativo.
                  </p>
                  <div className="flex items-center gap-2 rounded border border-border bg-secondary/30 px-3 py-2">
                    <Factory className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground font-sans">
                      PLCs, Sensores analógicos, Redes Fieldbus, SCADA legado
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Greenfield */}
              <Card className="border-border bg-card">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        Cenário Greenfield
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-sans">CPS Inteligentes</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Novos Sistemas Ciberfísicos (CPS) expõem APIs e AAS nativos, mas
                    frequentemente apresentam inconsistências ontológicas: unidades divergentes,
                    capacidades não padronizadas ou isolamento em silos de dados.
                  </p>
                  <div className="flex items-center gap-2 rounded border border-border bg-secondary/30 px-3 py-2">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground font-sans">
                      APIs REST/MQTT, CPS com AAS nativo, Digital Twins
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Solucao Proposta */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 lg:p-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      Solução Proposta: Agente Cognitivo TOON
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-sans">
                      Middleware Cognitivo com Decodificação Restrita
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  O problema central não é a falta de padrões, mas a ausência de um{" "}
                  <span className="text-foreground font-medium">middleware cognitivo</span> capaz
                  de automatizar a &quot;cola&quot; semântica entre a realidade física (sinais/APIs) e a
                  representação digital (AAS). Este trabalho propõe um agente baseado em LLM
                  que utiliza a notação TOON (Token-Oriented Object Notation) para garantir
                  100% de conformidade sintática antes da conversão para AAS final.
                </p>

                {/* Pipeline resumido */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {[
                    { step: "A", name: "Ingestão" },
                    { step: "B", name: "Raciocínio" },
                    { step: "C", name: "TOON" },
                    { step: "D", name: "Atuação" },
                  ].map((item, idx) => (
                    <div key={item.step} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5">
                        <span className="text-[10px] font-bold text-primary font-mono">
                          {item.step}
                        </span>
                        <span className="text-[11px] text-foreground font-sans">
                          {item.name}
                        </span>
                      </div>
                      {idx < 3 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/estrategia">
                    Entenda a Estratégia
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border">
                  <Link href="/agente">
                    Ir para o Agente
                    <Layers className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-5xl flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] text-muted-foreground font-sans">
            FIESC / UniSENAI / Instituto SENAI de Tecnologia / Instituto SENAI de Inovação
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            Pós-graduação em IA Aplicada - 2025/2026
          </p>
        </div>
      </footer>
    </div>
  )
}
