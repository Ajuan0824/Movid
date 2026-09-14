"use client";
import { Images, Sparkles, Aperture, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
export type AppTab = "home" | "momentos" | "pro" | "cuenta";
const TABS: Array<{ key: AppTab; icon: typeof Aperture }> = [{ key: "home", icon: Aperture }, { key: "momentos", icon: Images }, { key: "pro", icon: Sparkles }, { key: "cuenta", icon: UserRound }];
export function TabBar({ copy, tab, onChange }: { copy: AppCopy; tab: AppTab; onChange: (tab: AppTab) => void }) {
  const { plan, ready } = usePlan();
  const { user } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [user?.photoUrl]);
  const avatar = user?.photoUrl && !avatarFailed ? user.photoUrl : null;
  const tabs = ready && plan === "pro" ? TABS.filter(({ key }) => key !== "pro") : TABS;
  return <nav className="tab-bar" aria-label={copy.tabs.nav}>{tabs.map(({ key, icon: Icon }) => <motion.button key={key} type="button" className="tab-item" whileTap={{ scale: .94 }} aria-current={tab === key ? "page" : undefined} onClick={() => { tapHaptic(); onChange(key); }}>
    {tab === key && <motion.span layoutId="tab-bar-pill" className="tab-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
    {key === "cuenta" && avatar ?
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} className="relative h-[21px] w-[21px] rounded-full object-cover" />
      : <Icon size={21} strokeWidth={tab === key ? 2 : 1.6} className="relative" />}
    <span className="relative text-[10px] font-semibold">{copy.tabs[key]}</span>
  </motion.button>)}</nav>;
}
