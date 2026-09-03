import { NextRequest } from "next/server";
import { logServerError } from "../../../lib/server/log";

/**
 * Same-origin proxy for stored highlight images. Firebase Storage download URLs
 * don't send CORS headers, so the client can't `fetch()` them to build a File
 * for the share sheet — it would fall back to opening the URL in the browser.
 * Routing the fetch through here keeps it same-origin. Hosts are allow-listed
 * so this can't be used as an open proxy.
 */
const ALLOWED_HOSTS = new Set(["firebasestorage.googleapis.com", "storage.googleapis.com"]);

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) return new Response("missing url", { status: 400 });

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response("bad url", { status: 400 });
  }

  const hostAllowed = ALLOWED_HOSTS.has(url.hostname) || url.hostname.endsWith(".firebasestorage.app");
  if (url.protocol !== "https:" || !hostAllowed) {
    return new Response("host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return new Response("upstream error", { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      return new Response("unexpected content type", { status: 415 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    logServerError("asset proxy failed", error);
    return new Response("proxy error", { status: 502 });
  }
}
