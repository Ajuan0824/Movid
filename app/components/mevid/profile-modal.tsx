"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { GlassTextField } from "../auth/glass-text-field";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { useAuth } from "../../../hooks/use-auth";
import { changePassword, hasPasswordProvider, updateUserProfile } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { iosSpring } from "../../../lib/mevid/motion";

type ProfileModalProps = {
  copy: AppCopy;
  onClose: () => void;
};

function SuccessNote({ message }: { message: string }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3aa16b]">
      <Check size={13} />{message}
    </motion.p>
  );
}

export function ProfileModal({ copy, onClose }: ProfileModalProps) {
  const t = copy.auth.profile;
  const { user, refreshUser } = useAuth();

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={iosSpring}
        onClick={(event) => event.stopPropagation()}
        className="liquid-glass max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[30px] p-6"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#232331]">{t.title}</h2>
            <p className="mt-1 text-sm text-[#6d6b79]">{t.description}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-[#6d6b79] hover:bg-white">
            <X size={16} />
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-white bg-[#252334] text-2xl font-bold text-white shadow-[0_8px_20px_rgba(36,29,80,.2)]">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>

        <div className="liquid-glass-strong mb-4 rounded-2xl p-4">
          <GlassTextField label={t.nameLabel} value={name} onChange={setName} />
          <AnimatePresence>{nameError ? <AuthErrorBanner message={nameError} /> : null}</AnimatePresence>
          <div className="mt-3">
            <AuthSubmitButton loading={nameLoading} onTap={() => { tapHaptic(); void saveName(); }}>{t.saveName}</AuthSubmitButton>
          </div>
          <AnimatePresence>{nameSaved ? <SuccessNote message={t.nameSaved} /> : null}</AnimatePresence>
        </div>

        {canChangePassword ? (
          <div className="liquid-glass-strong rounded-2xl p-4">
            <h3 className="text-sm font-bold text-[#232331]">{t.passwordTitle}</h3>
            <p className="mb-3 mt-1 text-xs text-[#6d6b79]">{t.passwordDescription}</p>
            <div className="flex flex-col gap-3">
              <GlassTextField label={t.currentPasswordLabel} type="password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
              <GlassTextField label={t.newPasswordLabel} type="password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              <GlassTextField label={t.confirmPasswordLabel} type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            </div>
            <AnimatePresence>{passwordError ? <AuthErrorBanner message={passwordError} /> : null}</AnimatePresence>
            <div className="mt-3">
              <AuthSubmitButton loading={passwordLoading} onTap={() => { tapHaptic(); void savePassword(); }}>{t.changePassword}</AuthSubmitButton>
            </div>
            <AnimatePresence>{passwordSaved ? <SuccessNote message={t.passwordSaved} /> : null}</AnimatePresence>
          </div>
        ) : (
          <p className="rounded-2xl bg-[#f3f1fa] px-4 py-3 text-xs leading-5 text-[#6d6b79]">{t.noPasswordProvider}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
