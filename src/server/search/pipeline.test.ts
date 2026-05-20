import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/lib/listing-provider", () => ({
  getListingProvider: () => ({
    name: "seed",
    fetch: fetchMock,
  }),
}));

vi.mock("@/lib/geocode", () => ({
  geocodePlace: vi.fn(async () => null),
  distanceMiles: vi.fn(() => 0),
}));

vi.mock("@/lib/vibe", () => ({
  findNightlifeHotspots: vi.fn(async () => []),
  applyVibeToListings: vi.fn(),
}));

import { searchTrip } from "./pipeline";

beforeEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
});

const baseInput = {
  location: "Lisbon",
  checkIn: "2026-06-01",
  checkOut: "2026-06-05",
  groupSize: 2,
  pairs: 0,
  stayType: "both" as const,
  budgetMode: "total" as const,
  vibes: [],
};

function fakeListing(overrides: Partial<{ id: string; url: string; price: number }> = {}) {
  const id = overrides.id ?? "l1";
  const total = overrides.price ?? 400;
  return {
    id,
    source: "booking" as const,
    sourceId: id,
    type: "hotel" as const,
    url: overrides.url ?? `https://www.booking.com/hotel/${id}.html`,
    name: "Listing " + id,
    photos: [],
    location: { town: "Lisbon", country: "PT" },
    capacity: { maxGuests: 2, bedrooms: 1, realBeds: 1, couchBeds: 0, bunkBeds: 0 },
    bathrooms: { full: 1, half: 0 },
    amenities: {},
    pricing: {
      nightlyBase: Math.round(total / 4),
      fees: [],
      taxes: 0,
      totalForStay: total,
      totalPerPerson: Math.round(total / 2),
      currency: "USD",
    },
    scrapedAt: "2026-05-20T00:00:00.000Z",
  };
}

describe("searchTrip", () => {
  it("returns empty matched/overflow when the provider returns nothing", async () => {
    fetchMock.mockResolvedValue([]);

    const out = await searchTrip(baseInput);

    expect(out.matched).toEqual([]);
    expect(out.overflow).toEqual([]);
    expect(out.meta.providerName).toBe("seed");
    expect(out.meta.rawCount).toBe(0);
  });

  it("passes provider query params through from input", async () => {
    fetchMock.mockResolvedValue([]);

    await searchTrip({
      ...baseInput,
      pairs: 2,
      stayType: "hotels",
      minBeds: 3,
      minBathrooms: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith({
      location: "Lisbon",
      checkIn: "2026-06-01",
      checkOut: "2026-06-05",
      groupSize: 2,
      pairs: 2,
      stayType: "hotels",
      minBedrooms: 3,
      minBathrooms: 2,
    });
  });

  it("propagates provider errors", async () => {
    fetchMock.mockRejectedValue(new Error("upstream boom"));

    await expect(searchTrip(baseInput)).rejects.toThrow("upstream boom");
  });

  describe("affiliate tagging", () => {
    it("populates affiliateUrl on matched and overflow listings with anon click ID", async () => {
      vi.stubEnv("AFFILIATE_MARKER", "demo_marker");
      const a = fakeListing({ id: "a", price: 400 });
      const b = fakeListing({ id: "b", price: 1100 }); // 10% over -> overflow
      fetchMock.mockResolvedValue([a, b]);

      const out = await searchTrip({ ...baseInput, budgetMax: 1000 });

      const all = [...out.matched, ...out.overflow];
      expect(all.length).toBe(2);
      for (const l of all) {
        expect(l.affiliateUrl).toBeDefined();
        expect(l.affiliateUrl).toContain("marker=demo_marker");
        expect(l.affiliateUrl).toContain(`click_id=none%3Aanon%3A${l.id}`);
        expect(l.affiliateUrl).toContain("p=4115");
      }
    });

    it("leaves Listing.url untouched (so #50 can re-rewrite with real click ID)", async () => {
      vi.stubEnv("AFFILIATE_MARKER", "demo_marker");
      const original = "https://www.booking.com/hotel/keep-me.html";
      fetchMock.mockResolvedValue([fakeListing({ id: "x", url: original })]);

      const out = await searchTrip(baseInput);

      expect(out.matched[0].url).toBe(original);
    });

    it("does not set affiliateUrl when marker env is missing (passthrough)", async () => {
      vi.unstubAllEnvs();
      fetchMock.mockResolvedValue([fakeListing()]);

      const out = await searchTrip(baseInput);

      expect(out.matched[0].affiliateUrl).toBeUndefined();
    });

    it("does not set affiliateUrl for unsupported hosts", async () => {
      vi.stubEnv("AFFILIATE_MARKER", "demo_marker");
      fetchMock.mockResolvedValue([
        fakeListing({ id: "u", url: "https://random-direct-hotel.example/page" }),
      ]);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const out = await searchTrip(baseInput);

      expect(out.matched[0].affiliateUrl).toBeUndefined();
      warnSpy.mockRestore();
    });

    it("does not set affiliateUrl for known-unaffiliated hosts (airbnb)", async () => {
      vi.stubEnv("AFFILIATE_MARKER", "demo_marker");
      fetchMock.mockResolvedValue([
        fakeListing({ id: "ab", url: "https://www.airbnb.com/rooms/12345" }),
      ]);

      const out = await searchTrip(baseInput);

      expect(out.matched[0].affiliateUrl).toBeUndefined();
    });
  });
});
