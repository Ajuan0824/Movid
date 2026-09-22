"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  KeyRound,
  LogOut,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { usePlan } from "../../../hooks/use-plan";
import { AvatarPicker } from "./avatar-picker";
import { PageHeading, Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";
import { PlanBadge } from "./plan-badge";
import { StarMeter, StarMeterError } from "./star-meter";
import { AuthErrorBanner, AuthSubmitButton } from "../auth/auth-shell";
import { GlassTextField } from "../auth/glass-text-field";
import { deleteAccount } from "../../../lib/firebase/account";
import {
  changePassword,
  hasPasswordProvider,
  signOutUser,
  updateUserProfile,
} from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";

type AccountScreenProps = {
  copy: AppCopy;
  onGoPro: () => void;
};

function SuccessNote({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#3aa16b] dark:text-[#6fd39a]"
    >
      <Check size={15} />
      {message}
    </motion.p>
  );
}

export function AccountScreen({ copy, onGoPro }: AccountScreenProps) {
  const t = copy.auth.profile;
  const a = copy.account;
  const { user, refreshUser } = useAuth();
  const {
    plan,
    limit,
    starsLeft,
    ready: planReady,
    error: planError,
    reload: reloadPlan,
  } = usePlan();

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

  const [section, setSection] = useState<"name" | "password" | "delete" | null>(
    null,
  );

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
    <Screen className="account-screen">
      <PageHeading eyebrow={a.eyebrow} title={a.title} />
      <div className="flex items-center gap-4 py-2">
        <AvatarPicker
          copy={copy}
          size={62}
          radiusClass="rounded-full"
          onError={(message) => {
            setPhotoError(message);
            if (message) setPhotoSaved(false);
          }}
          onSaved={() => setPhotoSaved(true)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold tracking-tight">
            {user.displayName || user.email}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{user.email}</p>
        </div>
        {planReady && <PlanBadge copy={copy} plan={plan} />}
      </div>
      <AnimatePresence>
        {photoError && <AuthErrorBanner message={photoError} />}
        {photoSaved && <SuccessNote message={t.photoUpdated} />}
      </AnimatePresence>
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
        {planError ? (
          <StarMeterError copy={copy} onRetry={reloadPlan} />
        ) : planReady ? (
          <StarMeter copy={copy} left={starsLeft} total={limit} />
        ) : (
          <p className="text-sm text-muted">…</p>
        )}
        {planReady && plan !== "pro" && (
          <button
            onClick={onGoPro}
            className="primary-button account-upgrade-button mt-4 w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={15} />
              {a.upgrade}
            </span>
            <ChevronRight size={17} />
          </button>
        )}
      </div>
      <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4">
        <button className="settings-row" onClick={() => setSection("name")}>
          <UserRound size={18} />
          {t.nameTitle}
          <ChevronRight size={17} />
        </button>
        <button className="settings-row" onClick={() => setSection("password")}>
          <KeyRound size={18} />
          {t.passwordTitle}
          <ChevronRight size={17} />
        </button>
        <button
          className="settings-row"
          onClick={() => {
            tapHaptic();
            void signOutUser();
          }}
        >
          <LogOut size={18} />
          {copy.auth.account.signOut}
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
        <div className="flex gap-3">
          <a
            className="inline-flex min-h-11 items-center"
            href="/legal/terminos"
            target="_blank"
            rel="noopener noreferrer"
          >
            {a.terms}
          </a>
          <a
            className="inline-flex min-h-11 items-center"
            href="/legal/privacidad"
            target="_blank"
            rel="noopener noreferrer"
          >
            {a.privacy}
          </a>
        </div>
        <button
          className="min-h-11 text-[#b65a43] dark:text-[#f2a18a]"
          onClick={() => {
            setConfirmingDelete(false);
            setSection("delete");
          }}
        >
          {a.deleteTitle}
        </button>
      </div>
      {section && (
        <Sheet
          title={
            section === "name"
              ? t.nameTitle
              : section === "password"
                ? t.passwordTitle
                : a.deleteTitle
          }
          closeLabel={t.close}
          onClose={() => {
            if (!deleting) setSection(null);
          }}
        >
          {section === "name" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void saveName();
              }}
            >
              <GlassTextField
                label={t.nameLabel}
                value={name}
                onChange={setName}
                autoComplete="name"
              />
              <div className="mt-4">
                <AuthSubmitButton loading={nameLoading} onTap={tapHaptic}>
                  {t.saveName}
                </AuthSubmitButton>
              </div>
              {nameError && <AuthErrorBanner message={nameError} />}
              {nameSaved && <SuccessNote message={t.nameSaved} />}
            </form>
          )}
          {section === "password" &&
            (canChangePassword ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void savePassword();
                }}
              >
                <p className="mb-4 text-sm text-muted">
                  {t.passwordDescription}
                </p>
                <div className="flex flex-col gap-3">
                  <GlassTextField
                    label={t.currentPasswordLabel}
                    type="password"
                    visibilityLabels={copy.passwordVisibility}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                  />
                  <GlassTextField
                    label={t.newPasswordLabel}
                    type="password"
                    visibilityLabels={copy.passwordVisibility}
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                  />
                  <GlassTextField
                    label={t.confirmPasswordLabel}
                    type="password"
                    visibilityLabels={copy.passwordVisibility}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  <AuthSubmitButton loading={passwordLoading} onTap={tapHaptic}>
                    {t.changePassword}
                  </AuthSubmitButton>
                </div>
                {passwordError && <AuthErrorBanner message={passwordError} />}
                {passwordSaved && <SuccessNote message={t.passwordSaved} />}
              </form>
            ) : (
              <p className="text-sm leading-6 text-muted">
                {t.noPasswordProvider}
              </p>
            ))}
          {section === "delete" && (
            <>
              <TriangleAlert size={30} className="mb-3 text-[#b65a43]" />
              <p className="text-sm leading-6 text-muted">{a.deleteBody}</p>
              {deleteError && <AuthErrorBanner message={deleteError} />}
              {confirmingDelete ? (
                <div className="mt-5 grid gap-2">
                  <button
                    disabled={deleting}
                    className="primary-button !bg-[#b64d37] !text-white"
                    onClick={() => void removeAccount()}
                  >
                    {deleting ? a.deleting : a.deleteConfirm}
                  </button>
                  <button
                    disabled={deleting}
                    className="secondary-button"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    {a.deleteCancel}
                  </button>
                </div>
              ) : (
                <button
                  className="secondary-button mt-5 w-full !text-[#b64d37]"
                  onClick={() => {
                    setDeleteError(null);
                    setConfirmingDelete(true);
                  }}
                >
                  {a.deleteCta}
                </button>
              )}
            </>
          )}
        </Sheet>
      )}
    </Screen>
  );
}
