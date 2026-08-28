import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ClientBootstrap } from "./components/mevid/client-bootstrap";
import "./globals.css";
import { AuthProvider } from "../hooks/use-auth";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MeVid — find your best moments",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
