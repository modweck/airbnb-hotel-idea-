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
});
