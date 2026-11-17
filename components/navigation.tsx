"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Menu, Waypoints, X } from "lucide-react"
import { useState } from "react"
import { PRODUCT_NAME } from "@/lib/brand"

const NAV_ITEMS = [
  { href: "/", label: "Produto" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/estrategia", label: "Integrações" },
  { href: "/portfolio", label: "Soluções" },
]

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c151b]/90 text-[#eef4f2] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center bg-[#6fe4d4] text-[#0c151b] transition group-hover:bg-[#b6fff3]">
            <Waypoints className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-semibold tracking-[-0.02em] text-[#eef4f2]">{PRODUCT_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href
            return <Link key={item.href} href={item.href} className={`border-b py-1 text-sm transition ${isActive ? "border-[#6fe4d4] text-white" : "border-transparent text-[#8fa19e] hover:border-[#6fe4d4]/50 hover:text-white"}`}>{item.label}</Link>
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/agente" className="text-sm text-[#8fa19e] transition hover:text-white">Entrar</Link>
          <Link href="/agente" className="inline-flex h-10 items-center gap-2 bg-[#6fe4d4] px-4 text-sm font-semibold text-[#0c151b] transition hover:bg-[#b6fff3]">Começar agora<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>

        <button type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center border border-white/15 text-[#eef4f2] lg:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="border-t border-white/10 bg-[#0c151b] px-5 py-5 lg:hidden"><nav className="flex flex-col gap-1" aria-label="Navegação móvel">{NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-[#8fa19e] transition hover:text-white">{item.label}</Link>)}<Link href="/agente" onClick={() => setOpen(false)} className="mt-3 inline-flex h-11 items-center justify-center gap-2 bg-[#6fe4d4] text-sm font-semibold text-[#0c151b]">Começar agora<ArrowUpRight className="h-4 w-4" /></Link></nav></div>}
    </header>
  )
}
