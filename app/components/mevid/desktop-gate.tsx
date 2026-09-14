"use client";
import { ArrowUpRight, Smartphone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { Brand } from "./brand";
export function DesktopGate({ copy }: { copy: AppCopy }) {
  return <main className="relative flex min-h-dvh flex-col bg-[var(--page-bg)] p-10 text-[var(--ink)]">
    <header className="flex items-center justify-between"><Brand /><span className="eyebrow !mb-0">MADE FOR THE MOMENT</span></header>
    <section className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-2 items-center gap-20 py-14">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><p className="eyebrow">{copy.studio.tagline}</p><h1 className="font-display text-6xl font-medium leading-[1.05] tracking-[-.065em]">{copy.hero.title}<span className="font-editorial block">{copy.hero.titleAccent}</span></h1><p className="mt-5 max-w-sm text-base leading-7 text-muted">{copy.studio.heroHint}</p>
        <div className="mt-10 flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><Smartphone size={24} className="mt-1 shrink-0" /><div><h2 className="font-semibold">{copy.desktopGate.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{copy.desktopGate.description}</p></div></div>
      </motion.div>
      <motion.div className="relative mx-auto aspect-[3/4] w-full max-w-[330px]" initial={{ opacity: 0, rotate: -8, y: 30 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
        <div className="absolute inset-0 rotate-[7deg] rounded-[28px] border border-[var(--line)] bg-[#e2e8d6]" /><div className="absolute inset-0 rotate-[-6deg] overflow-hidden rounded-[28px] bg-[#25352d]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/carousel/01-selfie-friends.jpg" alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><p className="absolute bottom-6 left-6 right-6 font-editorial text-3xl text-white">{copy.studio.toMemories}<ArrowUpRight size={24} className="mt-3" /></p>
        </div><span className="photo-stamp !h-24 !w-24 !text-xs"><span><Sparkles className="mx-auto mb-2" />{copy.studio.aiSelected}</span></span>
      </motion.div>
    </section>
    <footer className="flex items-center justify-between border-t border-[var(--line)] pt-5 text-xs text-muted"><span>MoVid — 2026</span><div className="flex gap-6"><a href="/legal/privacidad">{copy.account.privacy}</a><a href="/legal/terminos">{copy.account.terms}</a></div></footer>
  </main>;
}
