"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight, KeyRound, LogOut, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { AvatarPicker } from "./avatar-picker";
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
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#3aa16b] dark:text-[#6fd39a]">
      <Check size={15} />{message}
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

  const [photoSaved, setPhotoSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  const togglePassword = () => {
    tapHaptic();
    setPasswordOpen((open) => {
      // Opening can push the form below the fold; bring it back into view once
      // the height animation has settled.
      if (!open) {
        window.setTimeout(() => {
          passwordSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 360);
      }
      return !open;
    });
  };

  if (!user) return null;
  const canChangePassword = hasPasswordProvider(user);

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
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={screenTransition} className="mx-auto flex w-full max-w-lg flex-1 flex-col py-3">
      <motion.div className="mb-4" variants={heroTextVariants} initial="hidden" animate="visible">
        <motion.h1 variants={heroTextItemVariants} className="font-display text-[38px] font-bold leading-none tracking-[-0.06em]">{copy.account.title}</motion.h1>
      </motion.div>

      <div className="glass-panel flex items-center gap-4 rounded-[26px] p-4 shadow-panel">
        <AvatarPicker
          copy={copy}
          size={64}
          radiusClass="rounded-2xl"
          onError={(message) => {
            setPhotoError(message);
            if (message) setPhotoSaved(false);
          }}
          onSaved={() => setPhotoSaved(true)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-[#242432] dark:text-[#f2f0f8]">{user.displayName ?? user.email}</p>
          <p className="truncate text-sm text-[#85818f] dark:text-[#a49fb0]">{user.email}</p>
        </div>
        {planReady ? <PlanBadge copy={copy} plan={plan} /> : null}
      </div>
      <AnimatePresence>{photoError ? <div className="mt-3"><AuthErrorBanner message={photoError} /></div> : null}</AnimatePresence>
      <AnimatePresence>{photoSaved ? <SuccessNote message={t.photoUpdated} /> : null}</AnimatePresence>

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
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white dark:bg-[#211e2c] text-[#7657dd] dark:text-[#c4b3ff]"><Sparkles size={18} /></span>
        <span className="flex-1">
          <span className="block text-base font-bold text-[#5c3fc4] dark:text-[#b9a6ff]">{copy.account.upgrade}</span>
          <span className="mt-0.5 block text-sm text-[#6d6b79] dark:text-[#a79fb5]">{copy.account.upgradeSub}</span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]" />
      </button>
      )}

      <div className="glass-panel mt-3 rounded-[26px] p-4 shadow-panel">
        <p className="font-display text-xl font-bold tracking-[-0.03em]">{t.title}</p>
        <div className="mt-4 flex flex-col gap-3">
          <GlassTextField label={t.nameLabel} value={name} onChange={setName} />
        </div>
        <AnimatePresence>{nameError ? <div className="mt-3"><AuthErrorBanner message={nameError} /></div> : null}</AnimatePresence>
        <div className="mt-3">
          <AuthSubmitButton loading={nameLoading} onTap={() => { tapHaptic(); void saveName(); }}>{t.saveName}</AuthSubmitButton>
        </div>
        <AnimatePresence>{nameSaved ? <SuccessNote message={t.nameSaved} /> : null}</AnimatePresence>

        <div ref={passwordSectionRef} className="mt-4 border-t border-[#e7e3ee] pt-1 dark:border-white/10">
          <button
            type="button"
            aria-expanded={passwordOpen}
            onClick={togglePassword}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-3 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0ecff] text-[#7657dd] dark:bg-[#2c2740] dark:text-[#c4b3ff]">
                <KeyRound size={17} />
              </span>
              <span className="text-base font-bold text-[#242432] dark:text-[#f2f0f8]">{t.passwordTitle}</span>
            </span>
            <motion.span
              animate={{ rotate: passwordOpen ? 180 : 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]"
            >
              <ChevronDown size={20} />
            </motion.span>
          </button>

          {/* `inert` keeps the collapsed fields out of the tab order without
              swapping display, which would kill the height animation. */}
          <motion.div
            initial={false}
            animate={{ height: passwordOpen ? "auto" : 0, opacity: passwordOpen ? 1 : 0 }}
            transition={{
              height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: passwordOpen ? 0.28 : 0.14, delay: passwordOpen ? 0.06 : 0 },
            }}
            className="overflow-hidden"
            inert={!passwordOpen}
          >
            {canChangePassword ? (
              <div className="px-1 pb-1">
                <p className="text-sm text-[#6d6b79] dark:text-[#a79fb5]">{t.passwordDescription}</p>
                <div className="mt-3 flex flex-col gap-3">
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
              <p className="mb-1 rounded-2xl bg-white/60 px-4 py-3.5 text-sm leading-5 text-[#6d6b79] dark:bg-white/5 dark:text-[#a79fb5]">{t.noPasswordProvider}</p>
            )}
          </motion.div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: tapScale }}
        onClick={() => { tapHaptic(); void signOutUser(); }}
        className="secondary-button mt-3 w-full !text-[#e0507a] dark:text-[#ff8fae]"
      >
        <LogOut size={19} />{copy.auth.account.signOut}
      </motion.button>
    </motion.section>
  );
}
