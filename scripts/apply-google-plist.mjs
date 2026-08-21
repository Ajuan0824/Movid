#!/usr/bin/env node
// One-off helper: reads ios/App/App/GoogleService-Info.plist (downloaded from
// Firebase Console) and registers its REVERSED_CLIENT_ID as a URL scheme in
// ios/App/App/Info.plist, so Google Sign-In can complete its redirect.
// Usage: node scripts/apply-google-plist.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const iosAppDir = join(process.cwd(), "ios", "App", "App");
const googlePlistPath = join(iosAppDir, "GoogleService-Info.plist");
const infoPlistPath = join(iosAppDir, "Info.plist");

const googlePlist = readFileSync(googlePlistPath, "utf8");
const match = googlePlist.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
if (!match) {
  console.error("Could not find REVERSED_CLIENT_ID in GoogleService-Info.plist");
  process.exit(1);
}
const reversedClientId = match[1];

let infoPlist = readFileSync(infoPlistPath, "utf8");
if (infoPlist.includes(reversedClientId)) {
  console.log("Info.plist already contains this URL scheme — nothing to do.");
  process.exit(0);
}

const urlTypesBlock = `\t<key>CFBundleURLTypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>CFBundleURLSchemes</key>\n\t\t\t<array>\n\t\t\t\t<string>${reversedClientId}</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n`;

infoPlist = infoPlist.replace(/<\/dict>\n<\/plist>/, `${urlTypesBlock}</dict>\n</plist>`);
writeFileSync(infoPlistPath, infoPlist);
console.log(`Added URL scheme for ${reversedClientId} to Info.plist`);
