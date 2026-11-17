import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  ChevronRight,
  CircleDot,
  FileText,
  GitBranch,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waypoints,
  Zap,
} from "lucide-react"
import { Navigation } from "@/components/navigation"
import { PRODUCT_NAME } from "@/lib/brand"

const BENEFITS = [
  { icon: ScanSearch, number: "01", title: "Entenda cada tag", text: "Conecte CLPs, APIs, IoT ou datasheets. O Semantic Agent transforma sinais soltos em dados com contexto." },
  { icon: ShieldCheck, number: "02", title: "Valide antes de publicar", text: "ECLASS, regras dimensionais e revisão humana protegem sua operação de mapeamentos frágeis." },
  { icon: GitBranch, number: "03", title: "Leve para a operação", text: "Gere AAS, JSON e fluxos Node-RED prontos para conectar seu chão de fábrica ao ecossistema digital." },
]

const FLOW = [
  { label: "Entrada", value: "DB1.DBD4", note: "Tag bruta", icon: CircleDot },
  { label: "Contexto", value: "ECLASS + RAG", note: "Evidência recuperada", icon: Network },
  { label: "Decisão", value: "Revisão assistida", note: "Confiança rastreável", icon: Sparkles },
  { label: "Saída", value: "AAS v3.0", note: "Pronto para integrar", icon: Boxes },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <Navigation />
      <main>
        <section className="relative border-b border-border/70">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(77,208,225,0.14),transparent_30%),radial-gradient(circle_at_15%_60%,rgba(27,94,110,0.14),transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-16 px-5 pb-20 pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-[11px] font-medium tracking-wide text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_currentColor]" />INTELIGÊNCIA PARA OPERAÇÕES INDUSTRIAIS</div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl lg:text-[4.5rem] lg:leading-[0.98]">Dê significado aos dados da sua fábrica.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">O {PRODUCT_NAME} conecta CLPs, IoT e sistemas industriais a uma camada semântica confiável — para que seus dados sejam entendidos, validados e usados.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/agente" className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Testar com meus dados<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                <Link href="#como-funciona" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-card">Ver como funciona<ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">{["Sem trocar seu legado", "ECLASS e AAS", "Controle humano"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>)}</div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-primary/8 blur-3xl" />
              <div className="relative rounded-2xl border border-border bg-card/90 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Waypoints className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-foreground">Semantic workspace</p><p className="text-[10px] text-muted-foreground">Linha 04 · Motor 02</p></div></div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Operando</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-[0.8fr_1fr]">
                  <div className="rounded-xl border border-border bg-background/70 p-4"><div className="mb-6 flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Entrada</span><FileText className="h-4 w-4 text-muted-foreground" /></div><p className="font-mono text-xl text-foreground">DB1.DBD4</p><p className="mt-2 text-xs text-muted-foreground">Motor_01 · PLC Siemens</p><div className="mt-6 flex items-center gap-2 text-[10px] text-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Sem significado atribuído</div></div>
                  <div className="rounded-xl border border-primary/25 bg-primary/7 p-4"><div className="mb-5 flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-primary">Interpretação</span><Sparkles className="h-4 w-4 text-primary" /></div><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><Zap className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-foreground">Velocidade</p><p className="font-mono text-[10px] text-primary">ECLASS 0173-1#02-BAA123</p></div></div><div className="mt-6 space-y-3"><div className="flex items-center justify-between text-[11px]"><span className="text-muted-foreground">Confiança</span><span className="font-medium text-emerald-300">94%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-background/80"><div className="h-full w-[94%] rounded-full bg-emerald-300" /></div><div className="flex items-center gap-2 text-[10px] text-emerald-300"><BadgeCheck className="h-3.5 w-3.5" />Evidência validada · AAS pronto</div></div></div>
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[10px] text-muted-foreground"><span>Última sincronização há 18s</span><span className="font-mono text-primary">AAS v3.0 · Node-RED</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-card/30"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 text-xs text-muted-foreground lg:px-8"><span className="font-medium text-foreground">Feito para quem mantém a indústria em movimento.</span><div className="flex flex-wrap items-center gap-x-6 gap-y-3 uppercase tracking-[0.14em]"><span>Automação</span><span>OEMs</span><span>Integradores</span><span>Data spaces</span></div></div></section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Uma camada entre o sinal e a decisão</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Menos interpretação manual. Mais operação.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Seu legado continua onde está. Nós organizamos o significado por cima dele e entregamos uma saída que pessoas e sistemas conseguem usar.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">{BENEFITS.map((benefit) => { const Icon = benefit.icon; return <article key={benefit.number} className="group rounded-2xl border border-border bg-card/60 p-6 transition hover:-translate-y-1 hover:border-primary/35 hover:bg-card"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><span className="font-mono text-xs text-muted-foreground/60">{benefit.number}</span></div><h3 className="mt-7 text-lg font-semibold text-foreground">{benefit.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{benefit.text}</p></article> })}</div>
        </section>

        <section className="border-y border-border/70 bg-card/25"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Do dado ao ativo digital</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Um fluxo simples para uma operação complexa.</h2></div><Link href="/estrategia" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-foreground">Conheça a arquitetura<ArrowRight className="h-4 w-4" /></Link></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">{FLOW.map((item, index) => { const Icon = item.icon; return <div key={item.label} className="relative bg-background p-6"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</span><Icon className="h-4 w-4 text-primary" /></div><p className="mt-10 font-mono text-sm text-foreground">{item.value}</p><p className="mt-2 text-xs text-muted-foreground">{item.note}</p>{index < FLOW.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-card p-1 text-primary md:block" />}</div> })}</div></div></section>

        <section id="produto" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-28"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pronto para integrar</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">A inteligência fica onde sua operação precisa.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Use o workspace para mapear ativos, o Edge para processar perto da máquina e os padrões AAS/ECLASS para conversar com o restante do ecossistema.</p><div className="mt-8 space-y-4">{["CLPs Siemens, Rockwell, Schneider e Mitsubishi", "Telemetria IoT, APIs e documentos técnicos", "Saídas AAS v3.0, JSON e Node-RED"].map((item) => <div key={item} className="flex items-start gap-3 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{item}</div>)}</div></div><div className="rounded-2xl border border-border bg-card p-3 shadow-xl shadow-black/20"><div className="rounded-xl border border-border bg-background p-5 sm:p-7"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs font-semibold text-foreground">Ativos conectados</p><p className="mt-1 text-[10px] text-muted-foreground">Visão geral da sua operação</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary">Tempo real</span></div><div className="grid gap-3 py-6 sm:grid-cols-3">{[{ label: "Ativos", value: "248", change: "+12%" }, { label: "Mapeamentos", value: "1.842", change: "+28%" }, { label: "Confiabilidade", value: "98,6%", change: "estável" }].map((item) => <div key={item.label} className="rounded-xl border border-border bg-card/70 p-4"><p className="text-[10px] text-muted-foreground">{item.label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p><p className="mt-2 text-[10px] text-emerald-300">{item.change}</p></div>)}</div><div className="rounded-xl border border-border bg-card/50 p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium text-foreground">Cobertura semântica</span><span className="font-mono text-xs text-primary">82%</span></div><div className="flex h-2 gap-1 overflow-hidden rounded-full bg-muted"><span className="w-[58%] bg-primary" /><span className="w-[24%] bg-primary/40" /><span className="w-[18%] bg-muted-foreground/20" /></div><div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-primary" />Validado</span><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-primary/40" />Em revisão</span><span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />Pendente</span></div></div></div></div></section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-2xl border border-primary/20 bg-primary/8 p-8 sm:p-12 lg:flex-row lg:items-center"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Comece pelo seu primeiro ativo</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Descubra o significado que seus dados estão escondendo.</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">Envie uma tag, um datasheet ou uma integração. O primeiro diagnóstico acontece em minutos.</p></div><Link href="/agente" className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Abrir workspace<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></section>
      </main>
      <footer className="border-t border-border/70 px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-foreground"><div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">SA</div><span className="font-medium">Semantic Agent</span></div><p>Inteligência semântica para operações industriais.</p><Link href="/portfolio" className="text-primary hover:text-foreground">Soluções e planos<ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div></footer>
    </div>
  )
}
