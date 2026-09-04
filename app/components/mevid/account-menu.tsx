"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages, LogOut, Moon, Settings, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { PlanBadge } from "./plan-badge";
import { signOutUser } from "../../../lib/firebase/auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import type { LocalePref } from "../../../lib/mevid/locale-pref";
import type { ThemePref } from "../../../lib/mevid/theme-pref";
import { ProfileModal } from "./profile-modal";

type SegmentOption<T extends string> = { value: T; label: string };

function SettingsRow<T extends string>({ icon, label, value, options, onChange }: { icon: React.ReactNode; label: string; value: T; options: SegmentOption<T>[]; onChange: (next: T) => void }) {
  return (
    <div className="mb-3">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-[#9996a4] dark:text-[#8b8697]">{icon}{label}</p>
      <div className="flex items-center gap-1 rounded-xl bg-[#f3f1fa] dark:bg-white/5 p-1" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                tapHaptic();
                onChange(option.value);
              }}
              className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-bold transition ${active ? "bg-white text-[#232331] shadow-sm dark:bg-[#3c3652] dark:text-[#f1eff7]" : "text-[#817d8a] hover:text-[#3c3946] dark:text-[#a79fb5] dark:hover:text-[#ece9f4]"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type AccountMenuProps = {
  copy: AppCopy;
  onManageAccount: () => void;
  localePref: LocalePref;
  onLocalePrefChange: (pref: LocalePref) => void;
  themePref: ThemePref;
  onThemePrefChange: (pref: ThemePref) => void;
};

export function AccountMenu({ copy, onManageAccount, localePref, onLocalePrefChange, themePref, onThemePrefChange }: AccountMenuProps) {
  const { status, user } = useAuth();
  const { plan, ready: planReady } = usePlan();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (status !== "signed-in" || !user) return null;

  const languageOptions: SegmentOption<LocalePref>[] = [
    { value: "system", label: copy.language.system },
    { value: "es", label: copy.language.spanish },
    { value: "en", label: copy.language.english },
  ];
  const appearanceOptions: SegmentOption<ThemePref>[] = [
    { value: "system", label: copy.appearance.system },
    { value: "light", label: copy.appearance.light },
    { value: "dark", label: copy.appearance.dark },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => {
          tapHaptic();
          setOpen((current) => !current);
        }}
        aria-label={copy.auth.account.settings}
        className="grid h-12 w-12 place-items-center rounded-full border border-white dark:border-white/10 bg-white/70 dark:bg-white/5 text-[#3c3946] dark:text-[#ece9f4] shadow-sm backdrop-blur-sm"
      >
        <Settings size={21} strokeWidth={2} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="liquid-glass-strong absolute right-0 top-14 z-40 w-[19rem] rounded-[22px] p-4"
          >
            <p className="truncate px-1 text-sm text-[#6d6b79] dark:text-[#a79fb5]">{copy.auth.account.signedInAs}</p>
            <div className="mb-4 flex items-center gap-2 px-1">
              <p className="min-w-0 flex-1 truncate text-base font-semibold text-[#232331] dark:text-[#f1eff7]">{user.displayName ?? user.email}</p>
              {planReady ? <PlanBadge copy={copy} plan={plan} /> : null}
            </div>

            <SettingsRow icon={<Languages size={14} />} label={copy.language.label} value={localePref} options={languageOptions} onChange={onLocalePrefChange} />
            <SettingsRow icon={<Moon size={14} />} label={copy.appearance.label} value={themePref} options={appearanceOptions} onChange={onThemePrefChange} />

            <div className="my-2.5 h-px bg-[#e7e3ee] dark:bg-white/10" />

            <button
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-base font-semibold text-[#3c3946] dark:text-[#ece9f4] hover:bg-[#f3f1fa] hover:dark:bg-[#26222f]"
            >
              <UserRound size={19} />{copy.auth.account.profile}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                void signOutUser();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-3 text-base font-semibold text-[#e0507a] dark:text-[#ff8fae] hover:bg-[#fff3f6] hover:dark:bg-[#2e2030]"
            >
              <LogOut size={19} />{copy.auth.account.signOut}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{profileOpen ? <ProfileModal copy={copy} onClose={() => setProfileOpen(false)} onManageAccount={onManageAccount} /> : null}</AnimatePresence>
    </div>
  );
}
