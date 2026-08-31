"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronRight, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { GlassTextField } from "../auth/glass-text-field";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { PlanBadge } from "./plan-badge";
import { hasPasswordProvider, updateUserProfile } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import { uploadProfilePhoto } from "../../../lib/firebase/storage";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { iosSpring } from "../../../lib/mevid/motion";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

type ProfileModalProps = {
  copy: AppCopy;
  onClose: () => void;
  onManageAccount: () => void;
};

function SuccessNote({ message }: { message: string }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3aa16b] dark:text-[#6fd39a]">
      <Check size={13} />{message}
    </motion.p>
  );
}

export function ProfileModal({ copy, onClose, onManageAccount }: ProfileModalProps) {
  const t = copy.auth.profile;
  const { user, refreshUser } = useAuth();
  const { plan, ready: planReady } = usePlan();

  const [name, setName] = useState(user?.displayName ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!user) return null;
  const canChangePassword = hasPasswordProvider(user);
  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  const pickPhoto = () => {
    tapHaptic();
    fileInputRef.current?.click();
  };

  const onPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError(null);
    setPhotoSaved(false);

    if (!file.type.startsWith("image/")) {
      setPhotoError(t.photoInvalidType);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t.photoTooLarge);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    setPhotoLoading(true);
    try {
      const uid = user.uid;
      const photoUrl = await uploadProfilePhoto(uid, file);
      await updateUserProfile({ photoUrl });
      await refreshUser();
      setPhotoSaved(true);
    } catch (err) {
      setPhotoError(copy.auth.errors[resolveAuthErrorKey(err)]);
    } finally {
      setPhotoLoading(false);
      URL.revokeObjectURL(localPreview);
      setPhotoPreview(null);
    }
  };

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
          <div className="relative shrink-0">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white bg-[#252334] text-sm font-bold text-white shadow-[0_6px_16px_rgba(36,29,80,.2)]">
              {photoPreview || user.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview ?? user.photoUrl!} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
              {photoLoading ? (
                <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={pickPhoto}
              disabled={photoLoading}
              aria-label={t.changePhoto}
              className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#7657dd] text-white shadow-sm dark:border-[#1c1a24] disabled:opacity-60"
            >
              <Camera size={10} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { void onPhotoSelected(event); }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-lg font-bold tracking-[-0.03em] text-[#232331] dark:text-[#f1eff7]">{t.title}</h2>
              {planReady ? <PlanBadge copy={copy} plan={plan} /> : null}
            </div>
            <p className="truncate text-xs text-[#85818f] dark:text-[#a49fb0]">{user.email}</p>
          </div>
          <button onClick={onClose} aria-label={t.close} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 dark:bg-white/5 text-[#6d6b79] dark:text-[#a79fb5] hover:bg-white dark:hover:bg-white/15">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence>{photoError ? <AuthErrorBanner message={photoError} /> : null}</AnimatePresence>
        <AnimatePresence>{photoSaved ? <SuccessNote message={t.photoUpdated} /> : null}</AnimatePresence>

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
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/60 dark:bg-white/5 p-3.5 text-left transition hover:bg-white dark:hover:bg-white/15"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#232331] dark:text-[#f1eff7]">{t.passwordTitle}</span>
              <span className="mt-0.5 block truncate text-xs text-[#6d6b79] dark:text-[#a79fb5]">{t.passwordDescription}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[#7657dd] dark:text-[#c4b3ff]" />
          </button>
        ) : (
          <p className="mt-3 rounded-2xl bg-[#f3f1fa] dark:bg-[#26222f] px-4 py-3 text-xs leading-5 text-[#6d6b79] dark:text-[#a79fb5]">{t.noPasswordProvider}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
