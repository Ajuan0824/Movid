"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { updateUserProfile } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import { uploadProfilePhoto } from "../../../lib/firebase/storage";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { AVATAR_MAX_BYTES, prepareAvatar } from "../../../lib/mevid/image";

type AvatarPickerProps = {
  copy: AppCopy;
  /** Rendered avatar size in px; the camera badge scales with it. */
  size?: number;
  /** Tailwind radius class for the avatar itself. */
  radiusClass?: string;
  onError: (message: string | null) => void;
  onSaved: () => void;
};

/**
 * The avatar plus its "change photo" badge, shared by the profile modal and the
 * account screen. Lives in one place because the upload has three steps that
 * must stay together: shrink locally, upload, then point the auth profile at
 * the new URL.
 */
export function AvatarPicker({ copy, size = 56, radiusClass = "rounded-full", onError, onSaved }: AvatarPickerProps) {
  const t = copy.auth.profile;
  const { user, refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
  // Big enough to be a comfortable tap target even on the smallest avatar.
  const badge = Math.max(28, Math.round(size * 0.42));
  const shown = preview ?? user.photoUrl ?? null;

  const pick = () => {
    tapHaptic();
    inputRef.current?.click();
  };

  const onSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    onError(null);
    if (!file.type.startsWith("image/")) {
      onError(t.photoInvalidType);
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      onError(t.photoTooLarge);
      return;
    }

    setLoading(true);
    let localPreview: string | null = null;
    let decoded = false;
    try {
      // Shrunk before anything else, so a 12MP gallery photo uploads as ~50 KB
      // and the preview shows exactly what gets stored.
      const avatar = await prepareAvatar(file);
      decoded = true;

      localPreview = URL.createObjectURL(avatar);
      setPreview(localPreview);

      const photoUrl = await uploadProfilePhoto(user.uid, avatar);
      await updateUserProfile({ photoUrl });
      await refreshUser();
      onSaved();
    } catch (err) {
      console.error("Avatar update failed", err);
      onError(decoded ? copy.auth.errors[resolveAuthErrorKey(err)] : t.photoUnreadable);
    } finally {
      setLoading(false);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setPreview(null);
    }
  };

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <div
        style={{ height: size, width: size, fontSize: Math.round(size * 0.36) }}
        className={`relative grid place-items-center overflow-hidden border border-white bg-[#252334] font-bold text-white shadow-[0_8px_20px_rgba(36,29,80,.2)] ${radiusClass}`}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
        {loading ? (
          <div className={`absolute inset-0 grid place-items-center bg-black/45 ${radiusClass}`}>
            <Loader2 size={Math.round(size * 0.34)} className="animate-spin text-white" />
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={pick}
        disabled={loading}
        aria-label={t.changePhoto}
        style={{ height: badge, width: badge }}
        className="absolute -bottom-1.5 -right-1.5 grid place-items-center rounded-full border-2 border-white bg-[#7657dd] text-white shadow-[0_4px_12px_rgba(60,40,140,.35)] transition active:scale-95 disabled:opacity-60 dark:border-[#1c1a24]"
      >
        <Camera size={Math.round(badge * 0.55)} />
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void onSelected(event)} />
    </div>
  );
}
