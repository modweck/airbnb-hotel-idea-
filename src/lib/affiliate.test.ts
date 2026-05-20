import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  rewriteOutboundUrl,
  tryRewriteOutboundUrl,
} from "./affiliate";

const MARKER = "TEST_MARKER";
const BASE_URL = "https://tp.media/r";
const CLICK_ID = "trip_lake-tahoe-2026:member_ikki:listing_alpine-cabin";

function call(url: string, overrides: Partial<Parameters<typeof tryRewriteOutboundUrl>[1]> = {}) {
  return tryRewriteOutboundUrl(url, {
    clickId: CLICK_ID,
    marker: MARKER,
    baseUrl: BASE_URL,
    ...overrides,
  });
}

describe("rewriteOutboundUrl", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.unstubAllEnvs();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("passthrough cases", () => {
    it("T1 no marker (env + opts both empty) -> passthrough", () => {
      const r = tryRewriteOutboundUrl("https://www.booking.com/hotel/x", {
        clickId: CLICK_ID,
      });
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("no_marker");
      expect(r.url).toBe("https://www.booking.com/hotel/x");
    });

    it("T2 invalid input URL -> passthrough invalid_input", () => {
      const r = call("not a url at all");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("invalid_input");
      expect(r.url).toBe("not a url at all");
    });

    it("T3 non-http(s) scheme -> passthrough", () => {
      for (const u of ["mailto:foo@example.com", "tel:+15551234", "about:blank"]) {
        const r = call(u);
        expect(r.wrapped).toBe(false);
        expect(r.reason).toBe("non_http_scheme");
        expect(r.url).toBe(u);
      }
    });

    it("T4 airbnb.com -> known_unaffiliated, silent (no warn)", () => {
      const r = call("https://www.airbnb.com/rooms/12345");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("known_unaffiliated");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("T5 unknown host -> passthrough + warn", () => {
      const r = call("https://example.com/some-page");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("unknown_host");
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain("example.com");
    });

    it("T6 already wrapped (tp.media) -> passthrough already_wrapped", () => {
      const r = call("https://tp.media/r?marker=XYZ&u=https%3A%2F%2Fbooking.com%2F");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("already_wrapped");
    });

    it("T6b already wrapped (stay22.com) -> passthrough already_wrapped", () => {
      const r = call("https://www.stay22.com/allez/direct?aid=XYZ&url=https%3A%2F%2Fbooking.com%2F");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("already_wrapped");
    });
  });

  describe("provider wraps", () => {
    it.each([
      ["https://www.booking.com/hotel/x.html", 4115],
      ["https://www.hotels.com/ho123/", 4034],
      ["https://www.vrbo.com/123abc/", 4499],
      ["https://www.expedia.com/lodging/h456", 4114],
      ["https://www.hotellook.com/cities/paris", 5210],
    ])("T7-T11 wraps %s with p=%i", (input, providerId) => {
      const r = call(input);
      expect(r.wrapped).toBe(true);
      expect(r.reason).toBeUndefined();
      const out = new URL(r.url);
      expect(out.origin + out.pathname).toBe(BASE_URL);
      expect(out.searchParams.get("marker")).toBe(MARKER);
      expect(out.searchParams.get("p")).toBe(String(providerId));
      expect(out.searchParams.get("u")).toBe(input);
      expect(out.searchParams.get("click_id")).toBe(CLICK_ID);
    });

    it("T12 hostname case-insensitive (BOOKING.COM matches)", () => {
      const r = call("https://BOOKING.COM/hotel/x");
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("p")).toBe("4115");
    });

    it("T13 trailing dot in hostname normalized", () => {
      const r = call("https://booking.com./hotel/x");
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("p")).toBe("4115");
    });

    it("T14 hostname with explicit port -> uses hostname not host", () => {
      const r = call("https://booking.com:443/hotel/x");
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("p")).toBe("4115");
    });

    it("T29 query params + fragment in destination preserved", () => {
      const input = "https://www.booking.com/hotel/x?a=1&b=2#rooms";
      const r = call(input);
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("u")).toBe(input);
    });

    it("T28 click_id with colons round-trips without double encoding", () => {
      const r = call("https://www.booking.com/x");
      const decoded = new URL(r.url).searchParams.get("click_id");
      expect(decoded).toBe(CLICK_ID);
      // Raw string must contain the encoded form once, not twice.
      const rawCount = (r.url.match(/%3A/g) ?? []).length;
      // Two colons in the click id, plus zero in the destination URL's encoded form.
      // %3A appears for each colon inside click_id, and inside the encoded `u=` URL (twice, once per colon in https://) -- but click_id colons must not be double-encoded (%253A).
      expect(r.url).not.toContain("%253A");
      expect(rawCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("google redirect unwrap", () => {
    it("T15 google.com/aclk?adurl=booking -> wraps booking", () => {
      const r = call("https://www.google.com/aclk?sa=L&ai=xyz&adurl=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fz");
      expect(r.wrapped).toBe(true);
      const out = new URL(r.url);
      expect(out.searchParams.get("p")).toBe("4115");
      expect(out.searchParams.get("u")).toBe("https://www.booking.com/hotel/z");
    });

    it("T16 google.com/url?url=hotels -> wraps hotels", () => {
      const r = call("https://www.google.com/url?sa=t&url=https%3A%2F%2Fwww.hotels.com%2Fh123&usg=xyz");
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("p")).toBe("4034");
    });

    it("T17 google with no adurl/url -> google_unwrap_failed, silent", () => {
      const r = call("https://www.google.com/search?q=hotels+in+tahoe");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("google_unwrap_failed");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("T18 google -> googleadservices -> booking (depth 2) -> wraps booking", () => {
      const inner = "https://www.booking.com/hotel/final";
      const middle = `https://www.googleadservices.com/pagead/aclk?adurl=${encodeURIComponent(inner)}`;
      const outer = `https://www.google.com/aclk?adurl=${encodeURIComponent(middle)}`;
      const r = call(outer);
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("u")).toBe(inner);
    });

    it("T19 google -> google -> google loop bounded -> google_unwrap_failed", () => {
      const a = "https://www.google.com/aclk?adurl=";
      const loop = `${a}${encodeURIComponent(`${a}${encodeURIComponent(`${a}${encodeURIComponent(`${a}`)}`)}`)}`;
      const r = call(loop);
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("google_unwrap_failed");
    });

    it("T20 google adurl=mailto:foo -> google_unwrap_failed (non-http intermediate)", () => {
      const r = call("https://www.google.com/aclk?adurl=mailto%3Afoo%40example.com");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("google_unwrap_failed");
    });

    it("T21 google `q=` param is NOT used as a destination", () => {
      const r = call("https://www.google.com/search?q=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fx");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("google_unwrap_failed");
    });
  });

  describe("security", () => {
    it("T22 booking.com.evil.test does NOT wrap", () => {
      const r = call("https://booking.com.evil.test/path");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("unknown_host");
      expect(r.url).toBe("https://booking.com.evil.test/path");
    });

    it("T23 https://booking.com@evil.test does NOT wrap (hostname=evil.test)", () => {
      const r = call("https://booking.com@evil.test/path");
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("unknown_host");
    });

    it("T24 google adurl=booking.com.evil.test -> not wrapped as booking", () => {
      const r = call("https://www.google.com/aclk?adurl=https%3A%2F%2Fbooking.com.evil.test%2Fpath");
      expect(r.wrapped).toBe(false);
      // Reason rolls up through unwrapIntermediary -> "google_unwrap_failed"
      // (we don't surface the inner unknown_host classification, since for
      // telemetry purposes a Google-mediated miss and a direct miss are
      // actionable differently).
      expect(r.reason).toBe("google_unwrap_failed");
      // The critical security invariant: the URL is NOT a wrapped affiliate
      // link for booking.com, regardless of how the rejection is classified.
      expect(r.url).not.toContain("p=4115");
    });
  });

  describe("API plumbing", () => {
    it("T25 opts.marker overrides env", () => {
      vi.stubEnv("AFFILIATE_MARKER", "ENV_MARKER");
      const r = call("https://www.booking.com/x", { marker: "OPT_MARKER" });
      expect(new URL(r.url).searchParams.get("marker")).toBe("OPT_MARKER");
    });

    it("T26 opts.baseUrl overrides env + default", () => {
      vi.stubEnv("AFFILIATE_BASE_URL", "https://env.example/r");
      const r = call("https://www.booking.com/x", { baseUrl: "https://opt.example/r" });
      const out = new URL(r.url);
      expect(out.origin + out.pathname).toBe("https://opt.example/r");
    });

    it("T27 invalid opts.baseUrl -> invalid_base_url passthrough", () => {
      const r = call("https://www.booking.com/x", { baseUrl: "::: not a url :::" });
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("invalid_base_url");
      expect(r.url).toBe("https://www.booking.com/x");
    });

    it("T30 rewriteOutboundUrl returns the .url field", () => {
      const a = rewriteOutboundUrl("https://www.booking.com/x", {
        clickId: CLICK_ID, marker: MARKER, baseUrl: BASE_URL,
      });
      const b = tryRewriteOutboundUrl("https://www.booking.com/x", {
        clickId: CLICK_ID, marker: MARKER, baseUrl: BASE_URL,
      });
      expect(a).toBe(b.url);
    });

    it("T31 empty / whitespace opts.marker treated as missing", () => {
      const r = call("https://www.booking.com/x", { marker: "   " });
      expect(r.wrapped).toBe(false);
      expect(r.reason).toBe("no_marker");
    });

    it("T31b env marker reads when opts.marker absent", () => {
      vi.stubEnv("AFFILIATE_MARKER", "ENV_MARKER_VAL");
      const r = tryRewriteOutboundUrl("https://www.booking.com/x", {
        clickId: CLICK_ID,
      });
      expect(r.wrapped).toBe(true);
      expect(new URL(r.url).searchParams.get("marker")).toBe("ENV_MARKER_VAL");
    });

    it("T31c default base URL is tp.media/r when none provided", () => {
      const r = tryRewriteOutboundUrl("https://www.booking.com/x", {
        clickId: CLICK_ID, marker: MARKER,
      });
      expect(r.wrapped).toBe(true);
      const out = new URL(r.url);
      expect(out.origin + out.pathname).toBe("https://tp.media/r");
    });
  });
});
