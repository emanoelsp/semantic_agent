"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Cpu, BookOpen, BrainCircuit, FlaskConical } from "lucide-react"

const NAV_ITEMS = [
  {
    href: "/",
    label: "Introducao",
    shortLabel: "Intro",
    icon: BookOpen,
    description: "Contexto do curso e problema",
  },
  {
    href: "/estrategia",
    label: "Estrategia & TOON",
    shortLabel: "Prompt",
    icon: BrainCircuit,
    description: "Engenharia de prompt e notacao",
  },
  {
    href: "/agente",
    label: "Agente Semantico",
    shortLabel: "Agente",
    icon: FlaskConical,
    description: "Dashboard interativo",
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground font-sans leading-tight">
                TOON Semantic Agent
              </p>
              <p className="text-[10px] text-muted-foreground font-sans leading-tight">
                IA Generativa - Avaliacao Intermediaria
              </p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold font-mono bg-secondary/70 text-muted-foreground border border-border shrink-0">
                    {index + 1}
                  </span>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden md:inline font-sans">{item.label}</span>
                  <span className="md:hidden font-sans">{item.shortLabel}</span>
                </Link>
              )
            })}
          </div>

          {/* Status Badge */}
          <Badge
            variant="secondary"
            className="hidden sm:flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] shrink-0"
          >
            MVP Mock
          </Badge>
        </div>
      </div>
    </nav>
  )
}
