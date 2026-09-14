import { spawn } from "node:child_process";

// Standalone visual review, without production credentials or backend requests.
// These deliberately invalid values only satisfy Firebase's import-time setup.
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENAI_API_KEY: "",
      NEXT_PUBLIC_REVENUECAT_IOS_KEY: "",
      NEXT_PUBLIC_FIREBASE_API_KEY: "design-preview-not-a-real-api-key",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "movid-design-preview",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000:web:design-preview",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "movid-design-preview.invalid",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "movid-design-preview.invalid",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 0));
