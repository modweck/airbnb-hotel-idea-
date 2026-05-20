import { describe, expect, test } from "vitest";
import type { Listing } from "@/lib/types";
import {
  applyBudgetFilter,
  listingMatchesBudget,
  normalizeBudget,
} from "@/lib/budget";

function makeListing(overrides: {
  id: string;
  totalForStay: number;
  totalPerPerson?: number;
}): Listing {
  return {
    id: overrides.id,
    source: "vrbo",
    sourceId: overrides.id,
    type: "house",
    url: `https://example.com/${overrides.id}`,
    name: `Listing ${overrides.id}`,
    photos: [],
    location: { town: "Tahoe", country: "US" },
    capacity: {
      maxGuests: 8,
      bedrooms: 4,
      realBeds: 4,
      couchBeds: 0,
      bunkBeds: 0,
    },
    bathrooms: { full: 2, half: 0 },
    amenities: {},
    pricing: {
      nightlyBase: overrides.totalForStay / 3,
      fees: [],
      taxes: 0,
      totalForStay: overrides.totalForStay,
      totalPerPerson:
        overrides.totalPerPerson ?? overrides.totalForStay / 8,
      currency: "USD",
    },
    scrapedAt: "2026-05-08T00:00:00Z",
  };
}

describe("normalizeBudget", () => {
  test("total mode: divides by groupSize for per-person view", () => {
    const out = normalizeBudget(
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.totalMax).toBe(1000);
    expect(out.perPersonMax).toBe(250);
  });

  test("per_person mode: multiplies by groupSize for total view", () => {
    const out = normalizeBudget(
      { budgetMax: 250, budgetMode: "per_person" },
      4,
    );
    expect(out.totalMax).toBe(1000);
    expect(out.perPersonMax).toBe(250);
  });

  test("undefined max yields undefined caps", () => {
    const out = normalizeBudget({ budgetMode: "total" }, 4);
    expect(out.totalMin).toBeUndefined();
    expect(out.totalMax).toBeUndefined();
    expect(out.perPersonMax).toBeUndefined();
  });

  test("total mode: budgetMin is passed through as totalMin", () => {
    const out = normalizeBudget(
      { budgetMin: 500, budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.totalMin).toBe(500);
    expect(out.totalMax).toBe(1000);
  });

  test("per_person mode: budgetMin is multiplied by groupSize", () => {
    const out = normalizeBudget(
      { budgetMin: 100, budgetMax: 250, budgetMode: "per_person" },
      4,
    );
    expect(out.totalMin).toBe(400);
    expect(out.totalMax).toBe(1000);
  });

  test("only budgetMin set yields totalMin without totalMax", () => {
    const out = normalizeBudget({ budgetMin: 500, budgetMode: "total" }, 4);
    expect(out.totalMin).toBe(500);
    expect(out.totalMax).toBeUndefined();
  });

  test("undefined mode is treated as total", () => {
    const out = normalizeBudget({ budgetMax: 1000 }, 4);
    expect(out.totalMax).toBe(1000);
    expect(out.perPersonMax).toBe(250);
  });

  test("group=0 with per_person mode keeps perPersonMax, drops totalMax", () => {
    const out = normalizeBudget(
      { budgetMax: 250, budgetMode: "per_person" },
      0,
    );
    expect(out.totalMax).toBeUndefined();
    expect(out.perPersonMax).toBe(250);
  });
});

describe("listingMatchesBudget", () => {
  const input = { budgetMax: 1000, budgetMode: "total" as const };

  test("listing under max → match", () => {
    const l = makeListing({ id: "a", totalForStay: 800 });
    expect(listingMatchesBudget(l, input, 4)).toBe("match");
  });

  test("listing exactly at max → match", () => {
    const l = makeListing({ id: "a", totalForStay: 1000 });
    expect(listingMatchesBudget(l, input, 4)).toBe("match");
  });

  test("listing within 1.15× max → overflow", () => {
    const l = makeListing({ id: "a", totalForStay: 1100 });
    expect(listingMatchesBudget(l, input, 4)).toBe("overflow");
  });

  test("listing exactly at 1.15× max → overflow", () => {
    const l = makeListing({ id: "a", totalForStay: 1150 });
    expect(listingMatchesBudget(l, input, 4)).toBe("overflow");
  });

  test("FP-edge: 1.15× of an inexactly-representable max still includes the boundary", () => {
    // 800 * 1.15 = 919.999...9 in IEEE 754, so a naive `cost <= max * 1.15`
    // would exclude a listing priced at exactly 920. Integer cents math fixes it.
    const l = makeListing({ id: "a", totalForStay: 920 });
    expect(
      listingMatchesBudget(
        l,
        { budgetMax: 800, budgetMode: "total" },
        4,
      ),
    ).toBe("overflow");
  });

  test("listing above 1.15× max → exclude", () => {
    const l = makeListing({ id: "a", totalForStay: 1200 });
    expect(listingMatchesBudget(l, input, 4)).toBe("exclude");
  });

  test("no max set → match", () => {
    const l = makeListing({ id: "a", totalForStay: 9999 });
    expect(listingMatchesBudget(l, {}, 4)).toBe("match");
  });

  test("listing below budgetMin → exclude (no overflow grace below floor)", () => {
    const inputWithMin = {
      budgetMin: 500,
      budgetMax: 1000,
      budgetMode: "total" as const,
    };
    const l = makeListing({ id: "cheap", totalForStay: 400 });
    expect(listingMatchesBudget(l, inputWithMin, 4)).toBe("exclude");
  });

  test("listing exactly at budgetMin → match", () => {
    const inputWithMin = {
      budgetMin: 500,
      budgetMax: 1000,
      budgetMode: "total" as const,
    };
    const l = makeListing({ id: "floor", totalForStay: 500 });
    expect(listingMatchesBudget(l, inputWithMin, 4)).toBe("match");
  });

  test("only budgetMin set: above floor → match", () => {
    const inputOnlyMin = { budgetMin: 500, budgetMode: "total" as const };
    const l = makeListing({ id: "ok", totalForStay: 2000 });
    expect(listingMatchesBudget(l, inputOnlyMin, 4)).toBe("match");
  });

  test("only budgetMin set: below floor → exclude", () => {
    const inputOnlyMin = { budgetMin: 500, budgetMode: "total" as const };
    const l = makeListing({ id: "too-cheap", totalForStay: 100 });
    expect(listingMatchesBudget(l, inputOnlyMin, 4)).toBe("exclude");
  });

  test("per_person mode: budgetMin is multiplied by groupSize", () => {
    const inputPP = {
      budgetMin: 100,
      budgetMax: 250,
      budgetMode: "per_person" as const,
    };
    // groupSize 4, totalMin = 400. $300 listing should be excluded.
    const cheap = makeListing({ id: "cheap", totalForStay: 300 });
    expect(listingMatchesBudget(cheap, inputPP, 4)).toBe("exclude");
    const ok = makeListing({ id: "ok", totalForStay: 800 });
    expect(listingMatchesBudget(ok, inputPP, 4)).toBe("match");
  });

  test("per_person mode: compares against converted total", () => {
    const l = makeListing({ id: "a", totalForStay: 800 });
    // budget: $250/person × 4 = $1000 total; listing totalForStay = $800 → match
    expect(
      listingMatchesBudget(
        l,
        { budgetMax: 250, budgetMode: "per_person" },
        4,
      ),
    ).toBe("match");
  });
});

describe("applyBudgetFilter", () => {
  test("returns all listings when no max is set", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 100 }),
      makeListing({ id: "b", totalForStay: 5000 }),
    ];
    const out = applyBudgetFilter(listings, {}, 4);
    expect(out.matched).toHaveLength(2);
    expect(out.overflow).toHaveLength(0);
  });

  test("≥3 matches → no overflow relaxation", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 200 }),
      makeListing({ id: "b", totalForStay: 400 }),
      makeListing({ id: "c", totalForStay: 600 }),
      makeListing({ id: "d", totalForStay: 800 }),
      makeListing({ id: "e", totalForStay: 1100 }), // would be overflow
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.matched.map((l) => l.id)).toEqual(["a", "b", "c", "d"]);
    expect(out.overflow).toHaveLength(0);
  });

  test("<3 matches → relaxes ceiling, populates overflow", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 800 }),
      makeListing({ id: "b", totalForStay: 1050 }), // overflow
      makeListing({ id: "c", totalForStay: 1100 }), // overflow
      makeListing({ id: "d", totalForStay: 1140 }), // overflow
      makeListing({ id: "e", totalForStay: 1300 }), // exclude (>1.15)
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.matched.map((l) => l.id)).toEqual(["a"]);
    expect(out.overflow.map((l) => l.id)).toEqual(["b", "c", "d"]);
  });

  test("zero matches and zero overflow → both empty", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 5000 }),
      makeListing({ id: "b", totalForStay: 6000 }),
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.matched).toHaveLength(0);
    expect(out.overflow).toHaveLength(0);
  });

  test("group=0 with per_person mode → no-op fallback (all in matched)", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 200 }),
      makeListing({ id: "b", totalForStay: 5000 }),
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 250, budgetMode: "per_person" },
      0,
    );
    expect(out.matched).toHaveLength(2);
    expect(out.overflow).toHaveLength(0);
  });

  test("matched listings sorted by totalForStay ascending", () => {
    const listings = [
      makeListing({ id: "expensive", totalForStay: 900 }),
      makeListing({ id: "cheap", totalForStay: 200 }),
      makeListing({ id: "mid", totalForStay: 500 }),
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.matched.map((l) => l.id)).toEqual([
      "cheap",
      "mid",
      "expensive",
    ]);
  });

  test("overflow listings sorted by totalForStay ascending", () => {
    const listings = [
      makeListing({ id: "a", totalForStay: 800 }),
      makeListing({ id: "high", totalForStay: 1140 }),
      makeListing({ id: "low", totalForStay: 1050 }),
      makeListing({ id: "mid", totalForStay: 1100 }),
    ];
    const out = applyBudgetFilter(
      listings,
      { budgetMax: 1000, budgetMode: "total" },
      4,
    );
    expect(out.overflow.map((l) => l.id)).toEqual(["low", "mid", "high"]);
  });
});
