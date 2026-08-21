"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { GlassTextField } from "../auth/glass-text-field";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { useAuth } from "../../../hooks/use-auth";
import { hasPasswordProvider, updateUserProfile } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { iosSpring } from "../../../lib/mevid/motion";

type ProfileModalProps = {
  copy: AppCopy;
  onClose: () => void;
  onManageAccount: () => void;
};

function SuccessNote({ message }: { message: string }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3aa16b]">
      <Check size={13} />{message}
    </motion.p>
  );
}

export function ProfileModal({ copy, onClose, onManageAccount }: ProfileModalProps) {
  const t = copy.auth.profile;
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.displayName ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

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
        className="liquid-glass max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[28px] p-5"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white bg-[#252334] text-sm font-bold text-white shadow-[0_6px_16px_rgba(36,29,80,.2)]">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold tracking-[-0.03em] text-[#232331]">{t.title}</h2>
            <p className="truncate text-xs text-[#85818f]">{user.email}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-[#6d6b79] hover:bg-white">
            <X size={16} />
          </button>
        </div>

        <div className="liquid-glass-strong rounded-2xl p-4">
          <GlassTextField label={t.nameLabel} value={name} onChange={setName} />
          <AnimatePresence>{nameError ? <AuthErrorBanner message={nameError} /> : null}</AnimatePresence>
          <div className="mt-3">
            <AuthSubmitButton loading={nameLoading} onTap={() => { tapHaptic(); void saveName(); }}>{t.saveName}</AuthSubmitButton>
          </div>
          <AnimatePresence>{nameSaved ? <SuccessNote message={t.nameSaved} /> : null}</AnimatePresence>
        </div>

        {canChangePassword ? (
          <button
            type="button"
            onClick={() => {
              tapHaptic();
              onClose();
              onManageAccount();
            }}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/60 p-3.5 text-left transition hover:bg-white"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#232331]">{t.passwordTitle}</span>
              <span className="mt-0.5 block truncate text-xs text-[#6d6b79]">{t.passwordDescription}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[#7657dd]" />
          </button>
        ) : (
          <p className="mt-3 rounded-2xl bg-[#f3f1fa] px-4 py-3 text-xs leading-5 text-[#6d6b79]">{t.noPasswordProvider}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
