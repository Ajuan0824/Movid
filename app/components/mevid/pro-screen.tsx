"use client";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";
import { PageHeading, Screen } from "../ui/screen";
const FALLBACK_MONTHLY_PRICE = "3,99 €";
type ProScreenProps = {
  copy: AppCopy;
  available: boolean;
  busy: boolean;
  hasOffering: boolean;
  monthlyPrice: string | null;
  onSubscribe: () => void;
  onRestore: () => void;
};
export function ProScreen({
  copy,
  available,
  busy,
  hasOffering,
  monthlyPrice,
  onSubscribe,
  onRestore,
}: ProScreenProps) {
  const t = copy.pro;
  const free = PLAN_LIMITS.free,
    pro = PLAN_LIMITS.pro;
  const price = monthlyPrice ?? FALLBACK_MONTHLY_PRICE;
  const nothingToSell = available && !hasOffering;
  const rows = [
    { label: t.compare.videos, free: free.stars, pro: pro.stars },
    { label: t.compare.moments, free: free.moments, pro: pro.moments },
    {
      label: t.compare.length,
      free: free.videoSeconds + "s",
      pro: pro.videoSeconds + "s",
    },
  ];
  return (
    <Screen className="pro-screen">
      <PageHeading eyebrow={copy.studio.proEyebrow} title={t.title} />
      <div className="pro-card relative flex flex-1 flex-col justify-between overflow-hidden rounded-[26px] bg-[#253b2f] text-[#f4f5e9]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-9 -top-9 h-52 w-52 rounded-full border border-[#d4ed8a]/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 h-36 w-36 rounded-full border border-[#d4ed8a]/20"
        />
        <div className="relative flex items-center justify-between">
          <span className="font-display text-xl font-medium tracking-tight">
            MoVid{" "}
            <span className="ml-1 rounded-full bg-[#d4ed8a] px-2 py-1 text-[11px] font-bold text-[#253b2f]">
              PRO
            </span>
          </span>
          <Sparkles size={25} strokeWidth={1.2} className="text-[#d4ed8a]" />
        </div>
        <div className="pro-card-copy relative">
          <p className="pro-card-tagline font-editorial">{t.subtitle}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-5xl font-medium tracking-[-.06em]">
              {price}
            </span>
            <span className="text-sm text-[#c4d0be]">{t.perMonth}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#c4d0be]">{t.billedMonthly}</p>
        </div>
        <table className="relative w-full border-collapse text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-[#bdcbb7]">
              <th className="pb-1 font-normal">
                <span className="sr-only">{t.subtitle}</span>
              </th>
              <th className="w-10 text-center font-normal">{t.freeLabel}</th>
              <th className="w-12 text-right font-normal text-[#d4ed8a]">
                {t.proLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <th className="py-2 font-normal">{row.label}</th>
                <td className="text-center text-[#bdcbb7]">{row.free}</td>
                <td className="text-right font-display text-lg font-semibold text-[#d4ed8a]">
                  {row.pro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shrink-0">
        <button
          disabled={busy || nothingToSell}
          onClick={onSubscribe}
          className="primary-button accent-button w-full justify-between"
        >
          <span>{busy ? t.activating : t.cta}</span>
          <ArrowUpRight size={19} />
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">
          {nothingToSell ? t.noOffering : t.trial.replace("{price}", price)}
        </p>
        <button
          disabled={busy}
          onClick={onRestore}
          className="mx-auto block min-h-10 text-xs font-semibold"
        >
          {busy ? t.restoring : t.restore}
        </button>
        <div className="flex justify-center gap-4 text-[10px] text-muted">
          <a
            href="/legal/terminos"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {copy.account.terms}
          </a>
          <a
            href="/legal/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {copy.account.privacy}
          </a>
        </div>
      </div>
    </Screen>
  );
}
