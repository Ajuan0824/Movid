export function logServerError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[mevid:${scope}]`, message, error instanceof Error ? error.stack : undefined);
}
