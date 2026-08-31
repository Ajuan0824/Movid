"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import type { Locale } from "../../../lib/mevid/types";
import { ForgotPasswordScreen } from "./forgot-password-screen";
import { LoginScreen } from "./login-screen";
import { RegisterScreen } from "./register-screen";

type AuthView = "login" | "register" | "forgot";

type AuthGateProps = {
  copy: AppCopy;
  locale: Locale;
  children: ReactNode;
};

export function AuthGate({ copy, locale, children }: AuthGateProps) {
  const { status } = useAuth();
  const [view, setView] = useState<AuthView>("login");

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <motion.div
          className="h-9 w-9 rounded-full border-2 border-[#e5ddff] dark:border-[#4a3f73] border-t-[#7657dd]"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (status === "signed-in") return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      {view === "login" ? <LoginScreen key="login" copy={copy} onNavigate={setView} /> : null}
      {view === "register" ? <RegisterScreen key="register" copy={copy} onNavigate={setView} /> : null}
      {view === "forgot" ? <ForgotPasswordScreen key="forgot" copy={copy} locale={locale} onNavigate={setView} /> : null}
    </AnimatePresence>
  );
}
