"use client";
import { Languages, Moon, Settings, UserRound, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "../../../hooks/use-auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { LocalePref } from "../../../lib/mevid/locale-pref";
import type { ThemePref } from "../../../lib/mevid/theme-pref";
import { Sheet } from "../ui/sheet";
function SettingsRow<T extends string>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </legend>
      <div className="flex gap-1 rounded-2xl bg-[var(--page-bg)] p-1">
        {options.map((option) => (
          <label key={option.value} className="relative flex-1 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={label}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="flex min-h-11 items-center justify-center rounded-xl px-1 text-xs text-muted peer-checked:bg-[var(--accent)] peer-checked:font-bold peer-checked:text-[#25352d] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--violet)]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
type Props = {
  copy: AppCopy;
  onManageAccount: () => void;
  localePref: LocalePref;
  onLocalePrefChange: (pref: LocalePref) => void;
  themePref: ThemePref;
  onThemePrefChange: (pref: ThemePref) => void;
};
export function AccountMenu({
  copy,
  onManageAccount,
  localePref,
  onLocalePrefChange,
  themePref,
  onThemePrefChange,
}: Props) {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-[11px] font-semibold"
        aria-label={copy.auth.account.settings}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Settings size={16} aria-hidden="true" />
        {copy.auth.account.settings}
      </button>
      {open && (
        <Sheet
          title={copy.auth.account.settings}
          closeLabel={copy.auth.profile.close}
          onClose={() => setOpen(false)}
        >
          <SettingsRow
            icon={<Languages size={18} />}
            label={copy.language.label}
            value={localePref}
            options={[
              { value: "system", label: copy.language.system },
              { value: "en", label: copy.language.english },
              { value: "es", label: copy.language.spanish },
            ]}
            onChange={onLocalePrefChange}
          />
          <SettingsRow
            icon={<Moon size={18} />}
            label={copy.appearance.label}
            value={themePref}
            options={[
              { value: "system", label: copy.appearance.system },
              { value: "light", label: copy.appearance.light },
              { value: "dark", label: copy.appearance.dark },
            ]}
            onChange={onThemePrefChange}
          />
          {status === "signed-in" && (
            <button
              className="settings-row"
              onClick={() => {
                setOpen(false);
                onManageAccount();
              }}
            >
              <UserRound size={18} />
              {copy.auth.account.profile}
              <ChevronRight size={17} />
            </button>
          )}
          <div className="mt-4 flex gap-5 border-t border-[var(--line)] pt-5 text-xs text-muted">
            <a href="/legal/terminos" target="_blank" rel="noopener noreferrer">
              {copy.account.terms}
            </a>
            <a
              href="/legal/privacidad"
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.account.privacy}
            </a>
          </div>
        </Sheet>
      )}
    </>
  );
}
