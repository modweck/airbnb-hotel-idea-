import {
  KNOWN_AFFILIATE_HOSTS,
  KNOWN_INTERMEDIARIES,
  KNOWN_UNAFFILIATED,
  MAX_UNWRAP_DEPTH,
  TP_PROVIDER_IDS,
} from "./affiliate-providers";

const DEFAULT_BASE_URL = "https://tp.media/r";

export type RewriteReason =
  | "no_marker"
  | "invalid_input"
  | "invalid_base_url"
  | "non_http_scheme"
  | "already_wrapped"
  | "known_unaffiliated"
  | "unknown_host"
  | "google_unwrap_failed";

export interface RewriteResult {
  url: string;
  wrapped: boolean;
  reason?: RewriteReason;
}

export interface RewriteOpts {
  clickId: string;
  marker?: string;
  baseUrl?: string;
}

export function rewriteOutboundUrl(originalUrl: string, opts: RewriteOpts): string {
  return tryRewriteOutboundUrl(originalUrl, opts).url;
}

export function tryRewriteOutboundUrl(
  originalUrl: string,
  opts: RewriteOpts,
): RewriteResult {
  const marker = resolveMarker(opts.marker);
  if (!marker) return { url: originalUrl, wrapped: false, reason: "no_marker" };

  const baseUrlString = resolveBaseUrl(opts.baseUrl);
  const baseUrl = safeParseUrl(baseUrlString);
  if (!baseUrl) {
    return { url: originalUrl, wrapped: false, reason: "invalid_base_url" };
  }

  return rewriteInner(originalUrl, {
    marker,
    clickId: opts.clickId,
    baseUrl,
    baseUrlString,
    seen: new Set<string>(),
    depth: 0,
  });
}

interface InnerOpts {
  marker: string;
  clickId: string;
  baseUrl: URL;
  baseUrlString: string;
  seen: Set<string>;
  depth: number;
}

function rewriteInner(originalUrl: string, opts: InnerOpts): RewriteResult {
  const parsed = safeParseUrl(originalUrl);
  if (!parsed) {
    return { url: originalUrl, wrapped: false, reason: "invalid_input" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { url: originalUrl, wrapped: false, reason: "non_http_scheme" };
  }

  const host = normalizeHostname(parsed.hostname);

  if (host === normalizeHostname(opts.baseUrl.hostname) || KNOWN_AFFILIATE_HOSTS.has(host)) {
    return { url: originalUrl, wrapped: false, reason: "already_wrapped" };
  }

  if (KNOWN_INTERMEDIARIES.has(host)) {
    return unwrapIntermediary(parsed, originalUrl, opts);
  }

  if (KNOWN_UNAFFILIATED.has(host)) {
    return { url: originalUrl, wrapped: false, reason: "known_unaffiliated" };
  }

  const providerId = TP_PROVIDER_IDS[host];
  if (providerId === undefined) {
    console.warn(`[affiliate] unhandled host, passthrough: ${host}`);
    return { url: originalUrl, wrapped: false, reason: "unknown_host" };
  }

  return { url: buildWrappedUrl(originalUrl, providerId, opts), wrapped: true };
}

function unwrapIntermediary(
  parsed: URL,
  originalUrl: string,
  opts: InnerOpts,
): RewriteResult {
  if (opts.depth >= MAX_UNWRAP_DEPTH || opts.seen.has(originalUrl)) {
    return { url: originalUrl, wrapped: false, reason: "google_unwrap_failed" };
  }
  const target = parsed.searchParams.get("adurl") ?? parsed.searchParams.get("url");
  if (!target) {
    return { url: originalUrl, wrapped: false, reason: "google_unwrap_failed" };
  }

  const inner = safeParseUrl(target);
  if (!inner || (inner.protocol !== "https:" && inner.protocol !== "http:")) {
    return { url: originalUrl, wrapped: false, reason: "google_unwrap_failed" };
  }

  const nextSeen = new Set(opts.seen);
  nextSeen.add(originalUrl);
  const recursed = rewriteInner(target, {
    ...opts,
    depth: opts.depth + 1,
    seen: nextSeen,
  });

  // If recursion succeeded, propagate the wrap. If it failed (unknown host,
  // already_wrapped, etc.), surface a unified google_unwrap_failed so callers
  // can tell "we tried to extract from Google but couldn't monetize" apart
  // from "we had a clean miss on a direct URL".
  if (recursed.wrapped) return recursed;
  return { url: originalUrl, wrapped: false, reason: "google_unwrap_failed" };
}

function buildWrappedUrl(originalUrl: string, providerId: number, opts: InnerOpts): string {
  const out = new URL(opts.baseUrlString);
  out.searchParams.set("marker", opts.marker);
  out.searchParams.set("p", String(providerId));
  out.searchParams.set("u", originalUrl);
  out.searchParams.set("click_id", opts.clickId);
  return out.toString();
}

function resolveMarker(optsMarker: string | undefined): string | undefined {
  const fromOpts = optsMarker?.trim();
  if (fromOpts) return fromOpts;
  const fromEnv = readEnv("AFFILIATE_MARKER")?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : undefined;
}

function resolveBaseUrl(optsBaseUrl: string | undefined): string {
  const fromOpts = optsBaseUrl?.trim();
  if (fromOpts) return fromOpts;
  const fromEnv = readEnv("AFFILIATE_BASE_URL")?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL;
}

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[name];
}

function safeParseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function normalizeHostname(hostname: string): string {
  let h = hostname.toLowerCase();
  if (h.endsWith(".")) h = h.slice(0, -1);
  return h;
}
