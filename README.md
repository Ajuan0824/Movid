# MoVid

**Turn short videos into the still moments worth keeping.**

MoVid is an iPhone-first application that records a short video or imports one from the photo library, lets the user refine the section they care about, and uses AI to identify its strongest visual moments. The result is a curated collection of real, high-resolution still images from the original video—never AI-generated artwork.

MoVid was built for the **RevenueCat Shipaton 2026** and submitted to the **RevenueCat Design Award**. The experience is designed around a simple creative rhythm: **capture, refine, reveal**.

## How it works

1. **Capture or import** — record directly in the app or choose a longer video from Photos.
2. **Refine** — review the clip and trim the exact window to analyse.
3. **Analyse** — selected samples are sent to a server-side OpenAI vision workflow, which identifies the most memorable and visually strong moments.
4. **Choose the sharpest frame** — for every AI-selected moment, MoVid evaluates nearby frames locally and keeps the best exposed, sharpest real frame.
5. **Keep and share** — preview, select and download the resulting JPEG images. Saved collections remain available in the private Moments library for 30 days.

The Free plan includes **3 analyses per week**, **5 moments per video**, and clips of up to **15 seconds**. MoVid Pro includes **15 analyses per week**, **10 moments per video**, and clips of up to **30 seconds**.

## Judge walkthrough

For the clearest product tour on an iPhone:

1. Sign in with the private review account supplied in the submission.
2. Open **Settings** to try English/Spanish and Light/Dark/System appearance.
3. From **Home**, record a clip or import one from Photos.
4. Review or trim it, then tap **Find my moments**.
5. Explore the resulting still images, select several, and download them.
6. Open **Moments** to revisit a saved collection.
7. Open **Pro** to see localized App Store pricing and the RevenueCat purchase and restore experience.

Review credentials and subscription access are intentionally not stored in this public repository. The development-only `/design` gallery is not part of the functional demonstration; the submission materials show the real app running on an iPhone.

## Product and design highlights

- A mobile-first, editorial visual system with tactile controls, subtle depth and purposeful motion.
- Animated capture, analysis and reveal states that preserve context throughout the workflow.
- A direct-manipulation video trimmer optimized for touch.
- Image-first results with preview, multi-selection and export.
- English and Spanish localization, with English as the default language.
- Light, dark and system appearance modes without a flash of the wrong theme at launch.
- Reduced-motion support, visible keyboard focus, labelled dialogs and controls, and live language metadata for assistive technology.
- iPhone safe-area handling and layouts designed for compact screens without unnecessary page scrolling.
- Native haptic feedback for important interactions.

## RevenueCat integration

MoVid Pro is powered by RevenueCat on iOS:

- The Capacitor RevenueCat SDK is configured with the authenticated Firebase UID as the App User ID.
- The active `pro` entitlement is the source of truth for premium access.
- The current offering exposes a monthly package and localized App Store pricing.
- Purchase and restore flows update the interface from RevenueCat `CustomerInfo`.
- A protected Firebase webhook synchronizes subscription events to Firestore.
- Cancellation and billing issues preserve access until the entitlement actually expires; renewals, reactivations, refunds and temporary entitlement events are handled explicitly.
- Firestore rules prevent the client from granting itself Pro access.

No RevenueCat secret key is shipped in the client. The iOS SDK uses its public app-specific key; the webhook authorization value stays in the Firebase Functions environment.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 19, TypeScript |
| Mobile runtime | Capacitor 8, native iOS project |
| Styling | Tailwind CSS 3.4, custom responsive design system |
| Motion | Motion / Framer Motion, CSS animation, reduced-motion fallbacks |
| Authentication | Firebase Authentication, Sign in with Apple, Google, email/password |
| Data | Cloud Firestore |
| Media | Firebase Cloud Storage with 30-day retention |
| AI analysis | OpenAI vision through a server-only Next.js route |
| Subscriptions | RevenueCat Purchases for Capacitor, App Store subscriptions |
| Native features | Camera, Photos, haptics, keyboard and status-bar integration |
| Backend jobs | Firebase Cloud Functions and Cloud Scheduler |

MoVid is a Next.js application delivered inside a Capacitor iOS shell. This keeps the product UI in one component-driven codebase while retaining native authentication, subscriptions and device integrations.

## Architecture

```text
iPhone / Capacitor
  ├─ Firebase Authentication
  ├─ RevenueCat Purchases ──► App Store
  └─ Next.js interface
       ├─ local video sampling and sharp-frame selection
       ├─ /api/analyze ─────► OpenAI vision
       └─ Firestore + Storage
                                ▲
RevenueCat webhook ─────────────┘
```

AI determines **which moment matters**; the local image-quality pass determines **which exact frame best represents it**. This separation improves sharpness while ensuring every delivered image comes directly from the user's video.

## Repository structure

```text
app/
  api/analyze/          Server-side AI analysis
  components/auth/      Authentication experience
  components/mevid/     Product screens and reusable UI
  legal/                Privacy, terms and support pages
hooks/                  Auth, plan, purchases and preference state
lib/firebase/           Auth, Firestore and Storage services
lib/mevid/              Video, plans, localization and design utilities
functions/              RevenueCat webhook and scheduled maintenance
ios/                    Capacitor iOS project and StoreKit configuration
docs/                   Design-system documentation
```

## Local development

### Requirements

- Node.js 20 or newer
- npm
- A Firebase project
- An OpenAI API key
- macOS with Xcode for native iOS development
- RevenueCat and App Store Connect configuration for purchase testing

### Environment

Copy `.env.example` to `.env.local` and provide the required values:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_REVENUECAT_IOS_KEY=
```

`OPENAI_API_KEY` is server-only and must never be exposed to the browser. Firebase web configuration and the RevenueCat iOS app-specific key are public client configuration; backend credentials and webhook authorization values must remain outside the repository.

### Run and verify

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

The production Capacitor configuration points to the deployed HTTPS application. Use the documented `CAP_SERVER_URL` development override only for local device debugging. Do not change the bundle identifier, signing, entitlements, StoreKit product identifiers or production server URL as part of routine web development.

## Privacy and retention

- Videos and generated moments are private to the authenticated user.
- Media is automatically removed after 30 days through app cleanup and storage lifecycle rules.
- OpenAI receives only sampled frames during analysis, not the complete stored video.
- Payments are processed by Apple; MoVid never receives card details.
- Users can permanently delete their account and associated data from the app.

---

Built with care for the RevenueCat Shipaton 2026.
