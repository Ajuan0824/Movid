"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { PlanBadge } from "./plan-badge";
import { StarMeter, StarMeterError } from "./star-meter";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { GlassTextField } from "../auth/glass-text-field";
import { changePassword, hasPasswordProvider, signOutUser, updateUserProfile } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { heroTextItemVariants, heroTextVariants, screenTransition, tapScale } from "../../../lib/mevid/motion";

type AccountScreenProps = {
  copy: AppCopy;
  onGoPro: () => void;
};

function SuccessNote({ message }: { message: string }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3aa16b] dark:text-[#6fd39a]">
      <Check size={13} />{message}
    </motion.p>
  );
}

export function AccountScreen({ copy, onGoPro }: AccountScreenProps) {
  const t = copy.auth.profile;
  const { user, refreshUser } = useAuth();
  const { plan, limit, starsLeft, ready: planReady, error: planError, reload: reloadPlan } = usePlan();

  const [name, setName] = useState(user?.displayName ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;
  const canChangePassword = hasPasswordProvider(user);
  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  const saveName = async () => {
    setNameError(null);
    setNameSaved(false);
    setNameLoading(true);
    try {
      await updateUserProfile({ displayName: name });
      await refreshUser();
      setNameSaved(true);
    } catch (err) {
      setNameError(copy.auth.errors[resolveAuthErrorKey(err)]);
    } finally {
      setNameLoading(false);
    }
  };

  const savePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(copy.auth.errors.required);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(copy.auth.errors.passwordMismatch);
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(user.email ?? "", currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(copy.auth.errors[resolveAuthErrorKey(err)]);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-lg flex-1 flex-col py-9">
      <motion.div className="mb-6" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.div variants={heroTextItemVariants} className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] dark:bg-[#2c2740] px-3 py-1.5 text-xs font-bold text-[#7657dd] dark:text-[#c4b3ff]"><Sparkles size={13} />{copy.account.eyebrow}</motion.div>
        <motion.h1 variants={heroTextItemVariants} className="font-display text-4xl font-bold tracking-[-0.06em]">{copy.account.title}</motion.h1>
      </motion.div>

      <div className="glass-panel flex items-center gap-4 rounded-[26px] p-4 shadow-panel">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white bg-[#252334] text-lg font-bold text-white shadow-[0_8px_20px_rgba(36,29,80,.2)]">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-[#242432] dark:text-[#f2f0f8]">{user.displayName ?? user.email}</p>
          <p className="truncate text-xs text-[#85818f] dark:text-[#a49fb0]">{user.email}</p>
        </div>
        {planReady ? <PlanBadge copy={copy} plan={plan} /> : null}
      </div>

      {planReady ? (
        <div className="glass-panel mt-3 rounded-[26px] p-4 shadow-panel">
          {planError ? (
            <StarMeterError copy={copy} onRetry={reloadPlan} />
          ) : (
            <StarMeter copy={copy} left={starsLeft} total={limit} />
          )}
        </div>
      ) : null}

      {planReady && plan === "pro" ? null : (
      <button type="button" onClick={onGoPro} className="mt-3 flex w-full items-center gap-3 rounded-[22px] border border-[#dfd4ff] dark:border-[#4a3f73] bg-[#f0ecff] dark:bg-[#2c2740] p-4 text-left transition hover:-translate-y-0.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white dark:bg-[#211e2c] text-[#7657dd] dark:text-[#c4b3ff]"><Sparkles size={15} /></span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-[#5c3fc4] dark:text-[#b9a6ff]">{copy.account.upgrade}</span>
          <span className="mt-0.5 block text-xs text-[#6d6b79] dark:text-[#a79fb5]">{copy.account.upgradeSub}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]" />
      </button>
      )}

      <div className="glass-panel mt-3 rounded-[26px] p-5 shadow-panel">
        <p className="font-display text-lg font-bold tracking-[-0.03em]">{t.title}</p>
        <div className="mt-4 flex flex-col gap-3">
          <GlassTextField label={t.nameLabel} value={name} onChange={setName} />
        </div>
        <AnimatePresence>{nameError ? <div className="mt-3"><AuthErrorBanner message={nameError} /></div> : null}</AnimatePresence>
        <div className="mt-3">
          <AuthSubmitButton loading={nameLoading} onTap={() => { tapHaptic(); void saveName(); }}>{t.saveName}</AuthSubmitButton>
        </div>
        <AnimatePresence>{nameSaved ? <SuccessNote message={t.nameSaved} /> : null}</AnimatePresence>
      </div>

      {canChangePassword ? (
        <div className="glass-panel mt-3 rounded-[26px] p-5 shadow-panel">
          <p className="font-display text-lg font-bold tracking-[-0.03em]">{t.passwordTitle}</p>
          <p className="mt-1 text-xs text-[#6d6b79] dark:text-[#a79fb5]">{t.passwordDescription}</p>
          <div className="mt-4 flex flex-col gap-3">
            <GlassTextField label={t.currentPasswordLabel} type="password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <GlassTextField label={t.newPasswordLabel} type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <GlassTextField label={t.confirmPasswordLabel} type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          </div>
          <AnimatePresence>{passwordError ? <div className="mt-3"><AuthErrorBanner message={passwordError} /></div> : null}</AnimatePresence>
          <div className="mt-3">
            <AuthSubmitButton loading={passwordLoading} onTap={() => { tapHaptic(); void savePassword(); }}>{t.changePassword}</AuthSubmitButton>
          </div>
          <AnimatePresence>{passwordSaved ? <SuccessNote message={t.passwordSaved} /> : null}</AnimatePresence>
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-white/60 dark:bg-white/5 px-4 py-3 text-xs leading-5 text-[#6d6b79] dark:text-[#a79fb5]">{t.noPasswordProvider}</p>
      )}

      <motion.button
        whileTap={{ scale: tapScale }}
        onClick={() => { tapHaptic(); void signOutUser(); }}
        className="secondary-button mt-3 w-full !text-[#e0507a] dark:text-[#ff8fae]"
      >
        <LogOut size={16} />{copy.auth.account.signOut}
      </motion.button>
    </motion.section>
  );
}
