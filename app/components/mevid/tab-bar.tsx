"use client";

import { Clapperboard, Gem, Home, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { usePlan } from "../../../hooks/use-plan";

export type AppTab = "home" | "momentos" | "pro" | "cuenta";

type TabBarProps = {
  copy: AppCopy;
  tab: AppTab;
  onChange: (tab: AppTab) => void;
};

const TABS: Array<{ key: AppTab; icon: typeof Home }> = [
  { key: "home", icon: Home },
  { key: "momentos", icon: Clapperboard },
  { key: "pro", icon: Gem },
  { key: "cuenta", icon: UserRound },
];

export function TabBar({ copy, tab, onChange }: TabBarProps) {
  const { plan, ready } = usePlan();
  // Nothing to upsell to a subscriber. Only filter once the plan is known, so
  // free users don't watch the tab pop in.
  const tabs = ready && plan === "pro" ? TABS.filter(({ key }) => key !== "pro") : TABS;

  return (
    <nav
      aria-label={copy.tabs.nav}
      className="liquid-glass !fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-xl items-center justify-between gap-1 rounded-[26px] p-1.5"
    >
      {tabs.map(({ key, icon: Icon }) => {
        const active = tab === key;
        return (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.96 }}
            aria-label={copy.tabs[key]}
            aria-current={active}
            onClick={() => {
              tapHaptic();
              onChange(key);
            }}
            className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-[20px] transition-colors duration-200 ${active ? "text-[#5c3fc4] dark:text-[#b9a6ff]" : "text-[#6d6b79] dark:text-[#a79fb5] hover:text-[#3c3946] dark:hover:text-[#ece9f4]"}`}
          >
            {active ? (
              <motion.span
                layoutId="tab-bar-pill"
                className="absolute inset-0 rounded-[20px] bg-[#f0ecff] dark:bg-[#2c2740]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <Icon size={18} strokeWidth={active ? 2.4 : 2} className="relative z-10" />
            <span className="relative z-10 text-[10.5px] font-bold">{copy.tabs[key]}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
