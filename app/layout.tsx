import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ClientBootstrap } from "./components/mevid/client-bootstrap";
import { SplashScreen } from "./components/mevid/splash-screen";
import "./globals.css";
import { AuthProvider } from "../hooks/use-auth";
import { PlanProvider } from "../hooks/use-plan";
import { PurchasesProvider } from "../hooks/use-purchases";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoVid — find your best moments",
  description: "Record. Analyse. Share your best moments.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("mevid-theme-pref");
    var pref = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var resolved = pref === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;
    if (resolved === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
        <ClientBootstrap />
        <AuthProvider>
          <PlanProvider>
            <PurchasesProvider>{children}</PurchasesProvider>
          </PlanProvider>
        </AuthProvider>
        {/* Last in the DOM so it paints over the app while it boots. */}
        <SplashScreen />
      </body>
    </html>
  );
}
