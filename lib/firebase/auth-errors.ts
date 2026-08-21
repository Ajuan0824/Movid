export type AuthErrorKey =
  | "invalidEmail"
  | "userNotFound"
  | "wrongPassword"
  | "emailInUse"
  | "weakPassword"
  | "tooManyRequests"
  | "networkError"
  | "cancelled"
  | "unknown";

const CODE_MAP: Record<string, AuthErrorKey> = {
  "auth/invalid-email": "invalidEmail",
  "auth/user-not-found": "userNotFound",
  "auth/wrong-password": "wrongPassword",
  "auth/invalid-credential": "wrongPassword",
  "auth/email-already-in-use": "emailInUse",
  "auth/weak-password": "weakPassword",
  "auth/too-many-requests": "tooManyRequests",
  "auth/network-request-failed": "networkError",
  "auth/popup-closed-by-user": "cancelled",
  "auth/cancelled-popup-request": "cancelled",
  "auth/user-cancelled": "cancelled",
  "auth/canceled": "cancelled",
  "12501": "cancelled",
  "1000": "cancelled",
};

/**
 * Firebase/native errors don't share one shape (JS SDK uses `.code`, some
 * native bridges surface the code inside `.message`), so this checks both.
 */
export function resolveAuthErrorKey(error: unknown): AuthErrorKey {
  const raw = error as { code?: string; message?: string } | undefined;
  const code = raw?.code ?? "";
  const message = raw?.message ?? "";
  for (const [key, value] of Object.entries(CODE_MAP)) {
    if (code.includes(key) || message.includes(key)) return value;
  }
  return "unknown";
}
