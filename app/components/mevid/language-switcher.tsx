"use client";

import { Languages } from "lucide-react";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { Locale } from "../../../lib/mevid/types";

type LanguageSwitcherProps = {
  locale: Locale;
  copy: AppCopy;
  onChange: (locale: Locale) => void;
};

export function LanguageSwitcher({ locale, copy, onChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center rounded-full border border-white bg-white/75 p-1 shadow-sm backdrop-blur-sm" role="group" aria-label={copy.language.label}>
      <span className="grid h-7 w-7 place-items-center text-[#837e8d]" aria-hidden="true"><Languages size={15} /></span>
      <button onClick={() => onChange("en")} className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${locale === "en" ? "bg-[#252334] text-white shadow-sm" : "text-[#817d8a] hover:text-[#3c3946]"}`} aria-pressed={locale === "en"}>
        EN
      </button>
      <button onClick={() => onChange("es")} className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${locale === "es" ? "bg-[#252334] text-white shadow-sm" : "text-[#817d8a] hover:text-[#3c3946]"}`} aria-pressed={locale === "es"}>
        ES
      </button>
    </div>
  );
}
