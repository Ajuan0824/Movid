"use client";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AuthProvider } from "../../../hooks/use-auth";
import { PlanProvider } from "../../../hooks/use-plan";
import { PurchasesProvider } from "../../../hooks/use-purchases";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The local design gallery owns inert fixture contexts, never a live session.
  const designGallery =
    process.env.NODE_ENV === "development" && pathname === "/design";
  return (
    <MotionConfig reducedMotion="user">
      {designGallery ? (
        children
      ) : (
        <AuthProvider>
          <PlanProvider>
            <PurchasesProvider>{children}</PurchasesProvider>
          </PlanProvider>
        </AuthProvider>
      )}
    </MotionConfig>
  );
}
