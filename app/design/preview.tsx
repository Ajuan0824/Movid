"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthContext } from "../../hooks/use-auth";
import { PlanContext } from "../../hooks/use-plan";
import type { User } from "../../lib/firebase/auth";
import { getCopy } from "../../lib/mevid/copy";
import type {
  Locale,
  StoredGeneration,
  VideoHighlight,
} from "../../lib/mevid/types";
import type { ThemePref } from "../../lib/mevid/theme-pref";
import type { LocalePref } from "../../lib/mevid/locale-pref";
import { Brand } from "../components/mevid/brand";
import { IntroScreen } from "../components/mevid/intro-screen";
import { TabBar, type AppTab } from "../components/mevid/tab-bar";
import { HeaderStars } from "../components/mevid/star-meter";
import { AccountMenu } from "../components/mevid/account-menu";
import { MomentsLibrary } from "../components/mevid/moments-library";
import { ResultsScreen } from "../components/mevid/results-screen";
import { AnalysisScreen } from "../components/mevid/analysis-screen";
import { ReviewScreen } from "../components/mevid/review-screen";
import { ProScreen } from "../components/mevid/pro-screen";
import { AccountScreen } from "../components/mevid/account-screen";
import { LoginScreen } from "../components/auth/login-screen";
import { RegisterScreen } from "../components/auth/register-screen";
import { ForgotPasswordScreen } from "../components/auth/forgot-password-screen";
import { StarsEmptyModal } from "../components/mevid/stars-empty-modal";
import { Sheet } from "../components/ui/sheet";
type View =
  | AppTab
  | "results"
  | "review"
  | "trim"
  | "analysis"
  | "login"
  | "register"
  | "forgot"
  | "empty";
const scenes = [
  "01-selfie-friends",
  "02-street-food",
  "03-night-out",
  "04-dog-cafe",
  "05-dance-floor",
];
const titles = [
  "Just us.",
  "A little taste of summer.",
  "One more song.",
  "Our usual place.",
  "Stay a little longer.",
];
const moments: VideoHighlight[] = scenes.map((scene, index) => ({
  start: index * 2.8,
  end: index * 2.8 + 2,
  peakTime: index * 2.8 + 1,
  title: titles[index],
  image: "/carousel/" + scene + ".jpg",
}));
const user = {
  uid: "design-fixture",
  displayName: "Alex Morgan",
  email: "alex@example.invalid",
  photoUrl: null,
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: null,
  tenantId: null,
  providerData: [{ providerId: "password" }],
} as User;
const sampleVideo = "/design/sample.mp4";
/** Development-only fixtures: no sign-in, purchases, saving or AI requests. */
export function DesignGallery() {
  const [view, setView] = useState<View>("home");
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemePref>("light");
  const [selected, setSelected] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);
  const [found, setFound] = useState<VideoHighlight[] | null>(null);
  const [emptyStars, setEmptyStars] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [trim, setTrim] = useState({ start: 0, end: 15 });
  const [items, setItems] = useState<StoredGeneration[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null),
    recordRef = useRef<HTMLInputElement>(null),
    uploadRef = useRef<HTMLInputElement>(null);
  const copy = getCopy(locale);
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get(
      "view",
    ) as View | null;
    if (initial) setView(initial);
    setItems(
      Array.from({ length: 9 }, (_, index) => ({
        id: String(index),
        createdAt: new Date(Date.now() - index * 86400000),
        duration: 15,
        trimStart: 0,
        videoUrl: sampleVideo,
        highlights: [
          ...moments.slice(index % 5),
          ...moments.slice(0, index % 5),
        ],
      })),
    );
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = locale;
  }, [theme, locale]);
  useEffect(() => {
    if (view !== "analysis") return;
    setFound(null);
    setStep(0);
    const interval = window.setInterval(
      () => setStep((s) => (s + 1) % 4),
      1700,
    );
    const timer = window.setTimeout(() => setFound(moments), 7500);
    const done = window.setTimeout(() => setView("results"), 9000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      clearTimeout(done);
    };
  }, [view]);
  const tab: AppTab =
    view === "results" || view === "empty"
      ? "momentos"
      : ["home", "momentos", "pro", "cuenta"].includes(view)
        ? (view as AppTab)
        : "home";
  const authView = ["login", "register", "forgot"].includes(view);
  const note = () =>
    setMessage(
      "Design preview only. No account, payment or server data is changed.",
    );
  const language = (pref: LocalePref) => setLocale(pref === "es" ? "es" : "en");
  return (
    <AuthContext.Provider
      value={{
        status: authView ? "signed-out" : "signed-in",
        user: authView ? null : user,
        refreshUser: async () => {},
      }}
    >
      <PlanContext.Provider
        value={{
          ready: true,
          error: false,
          plan: "free",
          limit: 3,
          starsLeft: 2,
          spend: async () => false,
          reload: () => {},
        }}
      >
        <main className="app-shell">
          <div className="app-frame">
            <header className="app-header">
              <Brand />
              <div className="flex items-center gap-2">
                {!authView && (
                  <HeaderStars
                    copy={copy}
                    left={2}
                    total={3}
                    onClick={() => setEmptyStars(true)}
                  />
                )}
                <AccountMenu
                  copy={copy}
                  onManageAccount={() => setView("cuenta")}
                  localePref={locale}
                  onLocalePrefChange={language}
                  themePref={theme}
                  onThemePrefChange={setTheme}
                />
              </div>
            </header>
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--line)] py-1 text-[10px] text-muted">
              <label htmlFor="preview-screen" className="font-mono">
                DESIGN PREVIEW
              </label>
              <select
                id="preview-screen"
                aria-label="Preview screen"
                value={view}
                onChange={(e) => setView(e.target.value as View)}
                className="ml-auto h-7 max-w-[140px] bg-transparent"
              >
                {[
                  "home",
                  "momentos",
                  "results",
                  "review",
                  "trim",
                  "analysis",
                  "empty",
                  "pro",
                  "cuenta",
                  "login",
                  "register",
                  "forgot",
                ].map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </div>
            <div
              className={
                authView ? "flex min-h-0 flex-1 flex-col" : "app-content"
              }
              onSubmitCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
                note();
              }}
              onClickCapture={(e) => {
                if ((e.target as HTMLInputElement).type === "file") {
                  e.preventDefault();
                  e.stopPropagation();
                  note();
                  return;
                }
                const target = (e.target as HTMLElement).closest("button");
                if (!target) return;
                // Pure navigation and opening panels work. All service mutations are blocked.
                const text =
                  (target.textContent ?? "") +
                  (target.getAttribute("aria-label") ?? "");
                const blocked = [
                  copy.auth.account.signOut,
                  copy.auth.login.google,
                  copy.auth.login.apple,
                  copy.account.deleteConfirm,
                  copy.auth.profile.saveName,
                  copy.auth.profile.changePassword,
                ];
                if (blocked.some((label) => text.includes(label))) {
                  e.preventDefault();
                  e.stopPropagation();
                  note();
                }
              }}
            >
              <AnimatePresence mode="wait">
                {view === "home" && (
                  <IntroScreen
                    key={view}
                    copy={copy}
                    recordInputRef={recordRef}
                    uploadInputRef={uploadRef}
                    onRecord={() => setView("review")}
                    onUpload={() => setView("trim")}
                    onRecordFileChange={note}
                    onUploadFileChange={note}
                  />
                )}
                {(view === "momentos" || view === "empty") && (
                  <MomentsLibrary
                    key={view}
                    copy={copy}
                    generations={view === "empty" ? [] : items}
                    onOpen={() => setView("results")}
                    onDelete={(item) =>
                      setItems((list) => list.filter((x) => x.id !== item.id))
                    }
                    onGoHome={() => setView("home")}
                  />
                )}
                {view === "results" && (
                  <ResultsScreen
                    key={view}
                    copy={copy}
                    videoUrl={sampleVideo}
                    duration={15}
                    highlights={moments}
                    selected={selected}
                    checked={checked}
                    videoRef={videoRef}
                    onNewVideo={() => setView("momentos")}
                    newVideoLabel={copy.library.back}
                    onSelect={(_, i) => setSelected(i)}
                    onToggleCheck={(i) =>
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                    onDownloadOne={note}
                    onDownloadChecked={note}
                  />
                )}
                {(view === "review" || view === "trim") && (
                  <ReviewScreen
                    key={view}
                    copy={copy}
                    videoUrl={sampleVideo}
                    duration={view === "trim" ? trim.end - trim.start : 15}
                    sourceDuration={view === "trim" ? 30 : 15}
                    trimStart={trim.start}
                    onTrimChange={(start, end) => setTrim({ start, end })}
                    onRetry={() => setView("home")}
                    onAnalyse={() => setView("analysis")}
                  />
                )}
                {view === "analysis" && (
                  <AnalysisScreen
                    key={view}
                    copy={copy}
                    step={step}
                    videoUrl={sampleVideo}
                    duration={15}
                    found={found}
                  />
                )}
                {view === "pro" && (
                  <ProScreen
                    key={view}
                    copy={copy}
                    available={false}
                    busy={false}
                    hasOffering
                    monthlyPrice="3,99 €"
                    onSubscribe={note}
                    onRestore={note}
                  />
                )}
                {view === "cuenta" && (
                  <AccountScreen
                    key={view}
                    copy={copy}
                    onGoPro={() => setView("pro")}
                  />
                )}
                {view === "login" && (
                  <LoginScreen key={view} copy={copy} onNavigate={setView} />
                )}
                {view === "register" && (
                  <RegisterScreen key={view} copy={copy} onNavigate={setView} />
                )}
                {view === "forgot" && (
                  <ForgotPasswordScreen
                    key={view}
                    copy={copy}
                    locale={locale}
                    onNavigate={setView}
                  />
                )}
              </AnimatePresence>
            </div>
            {!authView && <TabBar copy={copy} tab={tab} onChange={setView} />}
          </div>
          {emptyStars && (
            <StarsEmptyModal
              copy={copy}
              locale={locale}
              plan="free"
              total={3}
              onClose={() => setEmptyStars(false)}
              onGoPro={() => setView("pro")}
            />
          )}
          {message && (
            <Sheet
              title="Design preview"
              closeLabel={copy.auth.profile.close}
              onClose={() => setMessage(null)}
            >
              <p className="text-sm leading-6 text-muted">{message}</p>
            </Sheet>
          )}
        </main>
      </PlanContext.Provider>
    </AuthContext.Provider>
  );
}
