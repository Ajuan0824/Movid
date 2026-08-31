"use client";

import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { sendPasswordReset } from "../../../lib/firebase/auth";
import { resolveAuthErrorKey } from "../../../lib/firebase/auth-errors";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { AuthErrorBanner, AuthShell, AuthSubmitButton } from "./auth-shell";
import { GlassTextField } from "./glass-text-field";

type ForgotPasswordScreenProps = {
  copy: AppCopy;
  onNavigate: (view: "login") => void;
};

export function ForgotPasswordScreen({ copy, onNavigate }: ForgotPasswordScreenProps) {
  const t = copy.auth.forgot;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email) {
      setError(copy.auth.errors.required);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(copy.auth.errors[resolveAuthErrorKey(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      footer={
        <button onClick={() => onNavigate("login")} className="font-semibold text-[#7657dd] dark:text-[#c4b3ff] hover:underline">{t.back}</button>
      }
    >
      {error ? <AuthErrorBanner message={error} /> : null}
      {sent ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f0ecff] dark:bg-[#2c2740] text-[#7657dd] dark:text-[#c4b3ff]"><MailCheck size={26} /></div>
          {/* Deliberately conditional: with email enumeration protection on,
              Firebase reports success whether or not an account exists, so
              claiming "we sent it" would be a guess. */}
          <p className="text-sm leading-6 text-[#4f4d5a] dark:text-[#d8d3e2]">{t.sent}</p>
          <p className="rounded-2xl bg-[#f3f1fa] dark:bg-[#26222f] px-4 py-3 text-xs leading-5 text-[#6d6b79] dark:text-[#a79fb5]">{t.sentSocialHint}</p>
        </motion.div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <GlassTextField label={t.emailLabel} type="email" value={email} onChange={setEmail} autoComplete="email" />
          <AuthSubmitButton loading={loading} onTap={() => tapHaptic()}>{t.submit}</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
