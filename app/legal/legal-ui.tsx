import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Public support and data-rights contact, shown on both legal pages and given
 * to Apple as the app's support address. It has to stay a mailbox someone
 * actually reads: privacy requests (access, deletion, portability) arrive here.
 */
export const CONTACT_EMAIL = "soportemovid@gmail.com";

/** Last substantive review of both documents. Bump it when you edit them. */
export const LAST_UPDATED = "2026-09-04";

export function LegalHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-10 border-b border-[#e7e3ee] pb-6 dark:border-white/10">
      <Link href="/" className="text-sm font-bold text-[#7657dd] dark:text-[#c4b3ff]">MoVid</Link>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em]">{title}</h1>
      <p className="mt-2 text-sm text-[#767381] dark:text-[#a79fb5]">{subtitle}</p>
      <p className="mt-1 text-sm text-[#9996a4] dark:text-[#8b8697]">
        Última actualización / Last updated: {LAST_UPDATED}
      </p>
    </header>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2.5 font-display text-xl font-bold tracking-[-0.03em]">{title}</h2>
      <div className="flex flex-col gap-2.5 text-[15px] leading-6 text-[#4f4d5a] dark:text-[#d8d3e2]">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** Divider between the Spanish and English halves of a page. */
export function LanguageDivider({ label }: { label: string }) {
  return (
    <div className="my-12 flex items-center gap-4">
      <span className="h-px flex-1 bg-[#e7e3ee] dark:bg-white/10" />
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#9996a4] dark:text-[#8b8697]">{label}</span>
      <span className="h-px flex-1 bg-[#e7e3ee] dark:bg-white/10" />
    </div>
  );
}

export function Mail() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#7657dd] underline underline-offset-2 dark:text-[#c4b3ff]">
      {CONTACT_EMAIL}
    </a>
  );
}
