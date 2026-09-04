"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, KeyRound, LogOut, Sparkles, TriangleAlert, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { AvatarPicker } from "./avatar-picker";
import { Disclosure, revealInView } from "./disclosure";
import { PlanBadge } from "./plan-badge";
import { StarMeter, StarMeterError } from "./star-meter";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { GlassTextField } from "../auth/glass-text-field";
import { PLAN_LIMITS } from "../../../lib/mevid/plan";
import { deleteAccount } from "../../../lib/firebase/account";
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
  const a = copy.account;
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

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Name starts open — it's the field people come here for. Password starts
  // collapsed so the screen fits without scrolling.
  const [nameOpen, setNameOpen] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const nameSectionRef = useRef<HTMLDivElement>(null);
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  const toggle = (setOpen: (update: (open: boolean) => boolean) => void) => () => {
    tapHaptic();
    setOpen((open) => !open);
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

  /** Server-side wipe, then sign-out. On success the auth listener unmounts
   *  this screen, so there is no success state to render. */
  const removeAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error("Account deletion failed", err);
      setDeleteError(a.deleteError);
      setDeleting(false);
      setConfirmingDelete(false);
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
          <p className="truncate text-sm font-semibold text-[#403d4b] dark:text-[#d7d2e2]">{user.email}</p>
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
          <span className="mt-0.5 block text-sm text-[#6d6b79] dark:text-[#a79fb5]">
            {copy.account.upgradeSub
              .replace("{pro}", String(PLAN_LIMITS.pro.stars))
              .replace("{moments}", String(PLAN_LIMITS.pro.moments))
              .replace("{seconds}", String(PLAN_LIMITS.pro.videoSeconds))}
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]" />
      </button>
      )}

      <div className="glass-panel mt-3 rounded-[26px] p-4 shadow-panel">
        <p className="font-display text-xl font-bold tracking-[-0.03em]">{t.title}</p>

        <Disclosure
          icon={<UserRound size={17} />}
          label={t.nameTitle}
          open={nameOpen}
          onToggle={toggle(setNameOpen)}
          sectionRef={nameSectionRef}
          onOpened={() => revealInView(nameSectionRef.current)}
        >
          <GlassTextField label={t.nameLabel} value={name} onChange={setName} />
          <AnimatePresence>{nameError ? <div className="mt-3"><AuthErrorBanner message={nameError} /></div> : null}</AnimatePresence>
          <div className="mt-3">
            <AuthSubmitButton loading={nameLoading} onTap={() => { tapHaptic(); void saveName(); }}>{t.saveName}</AuthSubmitButton>
          </div>
          <AnimatePresence>{nameSaved ? <SuccessNote message={t.nameSaved} /> : null}</AnimatePresence>
        </Disclosure>

        <div className="my-1 h-px bg-[#e7e3ee] dark:bg-white/10" />

        <Disclosure
          icon={<KeyRound size={17} />}
          label={t.passwordTitle}
          open={passwordOpen}
          onToggle={toggle(setPasswordOpen)}
          sectionRef={passwordSectionRef}
          onOpened={() => revealInView(passwordSectionRef.current)}
        >
          {canChangePassword ? (
            <>
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
            </>
          ) : (
            <p className="rounded-2xl bg-white/60 px-4 py-3.5 text-sm leading-5 text-[#6d6b79] dark:bg-white/5 dark:text-[#a79fb5]">{t.noPasswordProvider}</p>
          )}
        </Disclosure>
      </div>

      <motion.button
        whileTap={{ scale: tapScale }}
        onClick={() => { tapHaptic(); void signOutUser(); }}
        className="secondary-button mt-3 w-full !text-[#e0507a] dark:text-[#ff8fae]"
      >
        <LogOut size={19} />{copy.auth.account.signOut}
      </motion.button>

      {/* App Store 5.1.1(v): deleting the account has to be reachable in-app.
          Two taps, never one — the first only reveals what is about to go. */}
      <div className="mt-3 rounded-[22px] border border-[#f3d7e0] bg-white/60 p-4 dark:border-[#4a2f3b] dark:bg-white/5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#c8305c] dark:text-[#ff8fae]">
          <TriangleAlert size={16} />{a.deleteTitle}
        </p>
        <p className="mt-1.5 text-sm leading-5 text-[#6d6b79] dark:text-[#a79fb5]">{a.deleteBody}</p>

        <AnimatePresence>{deleteError ? <div className="mt-3"><AuthErrorBanner message={deleteError} /></div> : null}</AnimatePresence>

        {confirmingDelete ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <motion.button
              whileTap={{ scale: tapScale }}
              disabled={deleting}
              onClick={() => { tapHaptic(); void removeAccount(); }}
              className="flex-1 rounded-full bg-[#c8305c] px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60"
            >
              {deleting ? a.deleting : a.deleteConfirm}
            </motion.button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 rounded-full px-4 py-3 text-sm font-bold text-[#6d6b79] disabled:opacity-60 dark:text-[#a79fb5]"
            >
              {a.deleteCancel}
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: tapScale }}
            onClick={() => { tapHaptic(); setDeleteError(null); setConfirmingDelete(true); }}
            className="mt-3 w-full rounded-full border border-[#e9b6c6] px-4 py-3 text-sm font-bold text-[#c8305c] dark:border-[#6b3a4b] dark:text-[#ff8fae]"
          >
            {a.deleteCta}
          </motion.button>
        )}
      </div>

      {/* Guideline 3.1.2 wants these reachable from inside the app. */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-[#9996a4] dark:text-[#8b8697]">
        <a href="/legal/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{a.terms}</a>
        <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{a.privacy}</a>
      </div>
    </motion.section>
  );
}
