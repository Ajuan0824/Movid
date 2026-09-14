"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { screenTransition } from "../../../lib/mevid/motion";
/** A viewport-sized workspace; overflow remains reachable at large text sizes. */
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={screenTransition} className={`studio-screen ${className}`}>{children}</motion.section>;
}
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-heading">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <div className="flex items-start justify-between gap-3"><h1>{title}</h1>{action}</div>
    {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
  </header>;
}
