"use client";

import { useState } from "react";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import { signInWithApple, signInWithEmail, signInWithGoogle } from "../../../lib/firebase/auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { AuthErrorBanner, AuthShell, AuthSubmitButton } from "./auth-shell";
import { GlassTextField } from "./glass-text-field";
import { SocialButton } from "./social-button";

type LoginScreenProps = {
  copy: AppCopy;
  onNavigate: (view: "register" | "forgot") => void;
};

export function LoginScreen({ copy, onNavigate }: LoginScreenProps) {
  const t = copy.auth.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setError(copy.auth.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(copy.auth.errors[resolveAuthErrorKey(err)]);
    } finally {
      setLoading(false);
    }
  };

  const withSocial = async (provider: "google" | "apple", fn: () => Promise<unknown>) => {
    setError(null);
    setSocialLoading(provider);
    try {
      await fn();
    } catch (err) {
      console.error("Social sign-in failed:", err);
      const key = resolveAuthErrorKey(err);
      if (key !== "cancelled") setError(copy.auth.errors[key]);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthShell
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      footer={
        <>
          {t.noAccount}{" "}
          <button onClick={() => onNavigate("register")} className="font-semibold text-[#7657dd] dark:text-[#c4b3ff] hover:underline">{t.createAccount}</button>
        </>
      }
    >
      {error ? <AuthErrorBanner message={error} /> : null}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <GlassTextField label={t.emailLabel} type="email" value={email} onChange={setEmail} autoComplete="email" />
        <GlassTextField label={t.passwordLabel} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="button" onClick={() => onNavigate("forgot")} className="-mt-1 self-end text-xs font-semibold text-[#7657dd] dark:text-[#c4b3ff] hover:underline">
          {t.forgot}
        </button>
        <AuthSubmitButton loading={loading} onTap={() => tapHaptic()}>{t.submit}</AuthSubmitButton>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-[#aaa7b1] dark:text-[#948fa0]">
        <div className="h-px flex-1 bg-[#e7e3ee]" />{t.orDivider}<div className="h-px flex-1 bg-[#e7e3ee]" />
      </div>
      <div className="flex flex-col gap-3">
        <SocialButton provider="google" loading={socialLoading === "google"} disabled={socialLoading !== null} onClick={() => void withSocial("google", signInWithGoogle)}>{t.google}</SocialButton>
        <SocialButton provider="apple" loading={socialLoading === "apple"} disabled={socialLoading !== null} onClick={() => void withSocial("apple", signInWithApple)}>{t.apple}</SocialButton>
      </div>
    </AuthShell>
  );
}
