"use client";

import { Clapperboard, Gem, Home, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";

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
  return (
    <nav
      aria-label={copy.tabs.nav}
      className="glass-panel fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-1 rounded-[26px] p-1.5 shadow-panel"
    >
      {TABS.map(({ key, icon: Icon }) => {
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
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[20px] transition ${active ? "bg-[#f0ecff] text-[#5c3fc4]" : "text-[#6d6b79] hover:text-[#3c3946]"}`}
          >
            <Icon size={18} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10.5px] font-bold">{copy.tabs[key]}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
