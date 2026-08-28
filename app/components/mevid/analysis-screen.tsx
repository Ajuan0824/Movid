import { LoaderCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { AppCopy } from "../../../lib/mevid/copy";
import { heroTextItemVariants, heroTextVariants, screenTransition } from "../../../lib/mevid/motion";

type AnalysisScreenProps = { copy: AppCopy; step: number };

export function AnalysisScreen({ copy, step }: AnalysisScreenProps) {
  return (
    <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={screenTransition} className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-16 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={screenTransition} className="analysis-orbit mb-10"><div className="analysis-orbit-inner"><Sparkles size={30} /></div><span className="analysis-spark analysis-spark-one" /><span className="analysis-spark analysis-spark-two" /><span className="analysis-spark analysis-spark-three" /></motion.div>
      <motion.div variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] dark:bg-[#2c2740] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:text-[#c4b3ff]"><LoaderCircle size={13} className="animate-spin" />{copy.analysis.eyebrow}</motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em] sm:text-5xl">{copy.analysis.title}</motion.h1>
        <motion.p variants={heroTextItemVariants} className="mt-4 min-h-6 text-sm font-medium text-[#777481] dark:text-[#a79fb5]">{copy.analysis.steps[step]}</motion.p>
      </motion.div>
      <div className="mt-8 flex gap-2">{copy.analysis.steps.map((item, index) => <span key={item} className={`h-1.5 w-10 rounded-full transition-colors ${index <= step ? "bg-[#7657dd]" : "bg-[#e6e3eb]"}`} />)}</div>
    </motion.section>
  );
}
