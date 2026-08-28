import { Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { Brand } from "./brand";
import { DotGrid } from "./dot-grid";

type DesktopGateProps = {
  copy: AppCopy;
};

export function DesktopGate({ copy }: DesktopGateProps) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#f8f7fb] px-6 text-center text-[#232331] dark:text-[#f1eff7]">
      <DotGrid />
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />
      <div className="absolute left-1/2 top-8 -translate-x-1/2">
        <Brand />
      </div>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="glass-panel relative mx-auto flex w-full max-w-md flex-col items-center gap-5 rounded-[34px] p-8 shadow-panel"
      >
        <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#252334] shadow-[0_8px_20px_rgba(36,29,80,.2)]">
          <Smartphone size={30} strokeWidth={1.8} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#232331] dark:text-[#f1eff7]">{copy.desktopGate.title}</h1>
        <p className="text-sm leading-6 text-[#6d6b79] dark:text-[#a79fb5]">{copy.desktopGate.description}</p>
      </motion.section>
    </main>
  );
}
