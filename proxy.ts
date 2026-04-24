import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Locale auto-detect middleware.
 *
 * Redirects first-time visitors whose browser Accept-Language is not zh-TW
 * to the matching supported locale via ?lang= query param. Respects explicit
 * user choice (any existing ?lang= is preserved).
 *
 * Why: the site's primary audience includes ~750K migrant workers whose
 * devices are set to vi/id/th/tl by default. Previously they all landed on
 * Chinese and had to find the globe dropdown themselves, tiny target in a
 * language they can't read.
 *
 * Supported locales (see lib/i18n/index.ts):
 *   zh-TW (default, no redirect)
 *   en, vi, id, th, fil
 *
 * Accept-Language parsing: we take the first entry's primary tag. Users with
 * "en-US,en;q=0.9,zh-TW;q=0.8" → en. Good enough for this case; we don't need
 * full quality-weight negotiation.
 */

const SUPPORTED = ["en", "vi", "id", "th", "fil"] as const;
type SupportedLang = (typeof SUPPORTED)[number];

// Map a BCP-47-ish primary tag to one of our supported locales.
// zh* → null (use default). Unknown → en (English as universal fallback for
// migrant workers: most printed signage/employers use English as L2).
function matchLocale(header: string | null): SupportedLang | null {
  if (!header) return null;
  const first = header.split(",")[0]?.trim().toLowerCase();
  if (!first) return null;
  const primary = first.split("-")[0]; // "en-us" → "en", "zh-tw" → "zh"

  if (primary === "zh") return null; // default locale, no redirect
  if (primary === "tl") return "fil"; // Tagalog → Filipino
  if ((SUPPORTED as readonly string[]).includes(primary)) {
    return primary as SupportedLang;
  }
  return "en"; // unknown language → English
}

export function proxy(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // If user already chose a locale (?lang=xx present), respect that.
  if (searchParams.has("lang")) return NextResponse.next();

  const target = matchLocale(req.headers.get("accept-language"));
  if (!target) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.searchParams.set("lang", target);
  // 307 preserves method; also not cached by browsers the way 301 is, so
  // toggling language later still works.
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Only run on public page routes. Skip API, Next.js internals, static assets,
  // and anything with a file extension (favicons, opengraph image, sitemap).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|icon|apple-icon|opengraph|sitemap|robots|manifest|sw\\.js|workbox|.*\\.).*)",
  ],
};
