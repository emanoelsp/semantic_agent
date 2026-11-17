import Link from "next/link"
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  GitBranch,
  Network,
  ScanSearch,
  ShieldCheck,
  Waypoints,
} from "lucide-react"
import { Navigation } from "@/components/navigation"

const USE_CASES = [
  ["Automação", "Tire significado de tags legadas sem parar a planta."],
  ["Integração", "Padronize ativos para conversar com APIs, parceiros e data spaces."],
  ["Engenharia", "Troque horas de interpretação manual por uma decisão rastreável."],
]

const STEPS = [
  { index: "01", title: "Conectar", text: "CLP, IoT, API ou documento." },
  { index: "02", title: "Contextualizar", text: "Catálogo, evidência e regras." },
  { index: "03", title: "Validar", text: "Confiança, unidade e revisão." },
  { index: "04", title: "Publicar", text: "AAS, JSON ou Node-RED." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c151b] text-[#eef4f2]">
      <Navigation />

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
            <div>
              <p className="mb-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6fe4d4]"><span className="h-px w-8 bg-[#6fe4d4]" />Industrial data layer</p>
              <h1 className="max-w-2xl text-5xl font-medium leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[5.2rem]">A camada semântica da sua operação.</h1>
              <p className="mt-8 max-w-lg text-lg leading-8 text-[#a4b5b3]">O Semantic Agent transforma tags, telemetria e documentos técnicos em dados com significado — prontos para integrar, validar e operar.</p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><Link href="/agente" className="group inline-flex h-12 items-center gap-3 bg-[#6fe4d4] px-5 text-sm font-semibold text-[#0c151b] transition hover:bg-[#b6fff3]">Abrir workspace<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link><Link href="#fluxo" className="inline-flex items-center gap-2 text-sm text-[#d4e1de] transition hover:text-[#6fe4d4]">Ver o fluxo<ArrowDownRight className="h-4 w-4" /></Link></div>
              <div className="mt-16 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-[11px] uppercase tracking-[0.16em] text-[#718481]"><span>ECLASS</span><span>AAS v3.0</span><span>Node-RED</span><span>CLP + IoT</span></div>
            </div>

            <div className="relative">
              <div className="absolute -left-5 top-8 h-40 w-px bg-[#6fe4d4]/70" />
              <div className="border border-white/15 bg-[#101e25] p-4 shadow-2xl shadow-black/30 sm:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-3"><Waypoints className="h-4 w-4 text-[#6fe4d4]" /><span className="text-xs font-medium text-white">Exemplo de mapeamento</span></div><span className="font-mono text-[10px] text-[#718481]">RUN / 0042</span></div>
                <div className="grid gap-0 py-6 sm:grid-cols-[1fr_44px_1.2fr] sm:items-center"><div className="border border-white/10 bg-[#0c151b] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-[#718481]">Fonte</p><p className="mt-5 font-mono text-lg text-white">DB1.DBD4</p><p className="mt-2 text-xs text-[#a4b5b3]">Motor_01 / Siemens S7</p><p className="mt-5 inline-flex items-center gap-2 text-[10px] text-[#f0c674]"><span className="h-1.5 w-1.5 rounded-full bg-[#f0c674]" />Sem contexto</p></div><div className="flex justify-center py-4 text-[#6fe4d4] sm:py-0"><ArrowRight className="h-5 w-5" /></div><div className="border border-[#6fe4d4]/35 bg-[#102c30] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#6fe4d4]">Significado</p><p className="mt-5 text-lg text-white">Velocidade</p></div><CircleCheck className="h-5 w-5 text-[#6fe4d4]" /></div><p className="mt-2 font-mono text-[10px] text-[#8ff1e2]">0173-1#02-BAA123</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[10px]"><span className="text-[#718481]">Unidade <b className="ml-1 font-normal text-white">m/s</b></span><span className="text-[#718481]">Evidência <b className="ml-1 font-normal text-[#8ff1e2]">validada</b></span></div></div></div>
                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-[10px]"><div><p className="text-[#718481]">Confiança</p><p className="mt-1 font-mono text-[#8ff1e2]">94,2%</p></div><div><p className="text-[#718481]">Revisão</p><p className="mt-1 text-white">Concluída</p></div><div><p className="text-[#718481]">Saída</p><p className="mt-1 text-white">AAS v3.0</p></div></div>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-[#718481]">Interface de exemplo · o dado original permanece intacto</p>
            </div>
          </div>
        </section>

        <section className="bg-[#edf1ef] text-[#172126]">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[0.75fr_1.25fr] lg:px-8 lg:py-28">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#188879]">O problema</p><h2 className="mt-5 text-4xl font-medium leading-[1.02] tracking-[-0.05em] sm:text-5xl">O dado existe. O contexto está espalhado.</h2></div>
            <div><p className="max-w-2xl text-xl leading-8 text-[#536360]">Entre uma tag de CLP e um ativo digital confiável existem decisões demais para depender de planilhas e memória de engenharia.</p><div className="mt-12 border-t border-[#cbd6d2]">{USE_CASES.map(([label, text]) => <div key={label} className="grid gap-3 border-b border-[#cbd6d2] py-5 sm:grid-cols-[150px_1fr] sm:items-center"><span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#188879]">{label}</span><span className="text-sm text-[#30413e]">{text}</span></div>)}</div></div>
          </div>
        </section>

        <section id="fluxo" className="border-b border-white/10 bg-[#111f25]">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6fe4d4]">O fluxo</p><h2 className="mt-5 max-w-xl text-4xl font-medium leading-[1.03] tracking-[-0.05em] sm:text-5xl">Uma decisão que deixa rastro.</h2></div><p className="max-w-sm text-sm leading-6 text-[#a4b5b3]">A inteligência acelera o trabalho. A evidência mantém a decisão sob controle.</p></div><div className="mt-14 grid border-l border-white/15 md:grid-cols-4 md:border-l-0 md:border-t">{STEPS.map((step) => <div key={step.index} className="relative border-b border-white/15 py-6 pl-6 md:border-b-0 md:border-r md:pl-6 md:pt-7 md:first:border-l"><span className="font-mono text-[11px] text-[#6fe4d4]">{step.index}</span><h3 className="mt-8 text-lg font-medium text-white">{step.title}</h3><p className="mt-2 text-sm text-[#829592]">{step.text}</p></div>)}</div></div>
        </section>

        <section className="bg-[#0c151b]">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6fe4d4]">Construído para a realidade industrial</p><h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.03] tracking-[-0.05em] sm:text-5xl">Seu legado não precisa desaparecer para ficar inteligente.</h2><p className="mt-6 max-w-xl text-base leading-7 text-[#a4b5b3]">O Semantic Agent entra como uma camada. Você mantém o que funciona e ganha um vocabulário que conecta engenharia, operação e software.</p><div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">{["Mapeamento de CLPs", "Datasheets e catálogos", "Telemetria e APIs", "AAS e Node-RED"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-[#d4e1de]"><Check className="h-4 w-4 text-[#6fe4d4]" />{item}</div>)}</div></div><div className="border border-white/10 bg-[#101e25] p-6"><div className="flex items-center gap-3 border-b border-white/10 pb-5"><ShieldCheck className="h-5 w-5 text-[#6fe4d4]" /><span className="text-sm font-medium text-white">Controle em cada saída</span></div><div className="space-y-4 pt-5">{[{ icon: ScanSearch, label: "Evidência recuperada" }, { icon: Network, label: "Unidade compatível" }, { icon: GitBranch, label: "Revisão registrada" }, { icon: FileText, label: "Artefato exportável" }].map(({ icon: Icon, label }) => <div key={label} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"><span className="flex items-center gap-3 text-sm text-[#d4e1de]"><Icon className="h-4 w-4 text-[#6fe4d4]" />{label}</span><CircleCheck className="h-4 w-4 text-[#6fe4d4]" /></div>)}</div></div></div>
        </section>

        <section className="border-t border-white/10 bg-[#6fe4d4] text-[#0c151b]"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-14 lg:flex-row lg:items-center lg:px-8"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#176c64]">Primeiro passo</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Comece por uma tag.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#27524f]">Veja o que seus dados podem significar antes de iniciar um projeto maior.</p></div><Link href="/agente" className="inline-flex h-12 shrink-0 items-center gap-3 border border-[#0c151b]/20 bg-[#0c151b] px-5 text-sm font-semibold text-[#eef4f2] transition hover:bg-[#1a2c31]">Abrir workspace<ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>

      <footer className="border-t border-white/10 bg-[#0c151b] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-[#718481] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 text-[#d4e1de]"><span className="flex h-6 w-6 items-center justify-center bg-[#6fe4d4] text-[9px] font-bold text-[#0c151b]">SA</span><span>Semantic Agent</span></div><span>Inteligência semântica para operações industriais.</span><Link href="/portfolio" className="text-[#6fe4d4] transition hover:text-white">Soluções e integrações <ChevronRight className="ml-1 inline h-3.5 w-3.5" /></Link></div></footer>
    </div>
  )
}
