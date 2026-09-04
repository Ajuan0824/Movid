import type { ReactNode } from "react";

/**
 * Public legal pages. Deliberately outside the app shell: no AuthGate and no
 * DesktopGate, because App Store review and the Privacy Policy URL in App Store
 * Connect are both opened on a desktop browser by someone who is not signed in.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#f8f7fb] px-5 py-12 text-[#232331] dark:bg-[#121018] dark:text-[#f1eff7]">
      <article className="mx-auto w-full max-w-2xl">{children}</article>
    </main>
  );
}
