"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import { signInWithApple, signInWithGoogle, signUpWithEmail } from "../../../lib/firebase/auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { AuthErrorBanner, AuthShell, AuthSubmitButton } from "./auth-shell";
import { GlassTextField } from "./glass-text-field";
import { SocialButton } from "./social-button";

type RegisterScreenProps = {
  copy: AppCopy;
  onNavigate: (view: "login") => void;
};

export function RegisterScreen({ copy, onNavigate }: RegisterScreenProps) {
  const t = copy.auth.register;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : password.length > 0 ? 1 : 0;
  const strengthLabel = [t.strengthWeak, t.strengthWeak, t.strengthGood, t.strengthStrong][strength];
  const strengthWidth = ["4%", "34%", "68%", "100%"][strength];
  const strengthColor = strength >= 3 ? "#1f7a4d" : strength === 2 ? "#7657dd" : "#f5b64a";

  const submit = async () => {
    if (!email || !password || !confirm) {
      setError(copy.auth.errors.required);
      return;
    }
    if (password !== confirm) {
      setError(copy.auth.errors.passwordMismatch);
      return;
    }
    if (!terms) {
      setError(copy.auth.errors.termsRequired);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
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
          {t.haveAccount}{" "}
          <button onClick={() => onNavigate("login")} className="font-semibold text-[#7657dd] hover:underline">{t.signIn}</button>
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
        <div>
          <GlassTextField label={t.passwordLabel} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          {password ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ece9f2]"><span className="block h-full rounded-full transition-all" style={{ width: strengthWidth, background: strengthColor }} /></span>
              <span className="font-mono text-[10px] font-bold text-[#85818f]">{strengthLabel}</span>
            </div>
          ) : null}
        </div>
        <GlassTextField label={t.confirmLabel} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

        <button
          type="button"
          role="checkbox"
          aria-checked={terms}
          onClick={() => setTerms((current) => !current)}
          className="flex items-center gap-2.5 text-left"
        >
          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[7px] border-2 transition ${terms ? "border-[#7657dd] bg-[#7657dd] text-white" : "border-[#cfc8df] text-transparent"}`}><Check size={12} strokeWidth={3} /></span>
          <span className="text-xs leading-4 text-[#6d6b79]">{t.termsText}</span>
        </button>

        <AuthSubmitButton loading={loading} onTap={() => tapHaptic()}>{t.submit}</AuthSubmitButton>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-medium text-[#aaa7b1]">
        <div className="h-px flex-1 bg-[#e7e3ee]" />{copy.auth.login.orDivider}<div className="h-px flex-1 bg-[#e7e3ee]" />
      </div>
      <div className="flex flex-col gap-3">
        <SocialButton provider="google" loading={socialLoading === "google"} disabled={socialLoading !== null} onClick={() => void withSocial("google", signInWithGoogle)}>{copy.auth.login.google}</SocialButton>
        <SocialButton provider="apple" loading={socialLoading === "apple"} disabled={socialLoading !== null} onClick={() => void withSocial("apple", signInWithApple)}>{copy.auth.login.apple}</SocialButton>
      </div>
    </AuthShell>
  );
}
