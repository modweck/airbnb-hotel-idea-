import { describe, expect, test } from "vitest";
import { matchesStarsFilter } from "@/lib/serpapi";

describe("matchesStarsFilter", () => {
  test("undefined stars = any (includes all classes)", () => {
    expect(matchesStarsFilter(3, undefined)).toBe(true);
    expect(matchesStarsFilter(undefined, undefined)).toBe(true);
  });

  test("empty stars = any (includes all classes)", () => {
    expect(matchesStarsFilter(4, [])).toBe(true);
    expect(matchesStarsFilter(undefined, [])).toBe(true);
  });

  test("matches when hotel_class is in the selected set", () => {
    expect(matchesStarsFilter(4, [4, 5])).toBe(true);
    expect(matchesStarsFilter(5, [4, 5])).toBe(true);
  });

  test("excludes when hotel_class is not in the selected set", () => {
    expect(matchesStarsFilter(3, [4, 5])).toBe(false);
    expect(matchesStarsFilter(2, [5])).toBe(false);
  });

  test("missing hotel_class is treated as 0 and excluded from any non-empty filter", () => {
    expect(matchesStarsFilter(undefined, [4, 5])).toBe(false);
    expect(matchesStarsFilter(undefined, [1, 2, 3, 4, 5])).toBe(false);
  });

  test("single-star selection works", () => {
    expect(matchesStarsFilter(5, [5])).toBe(true);
    expect(matchesStarsFilter(4, [5])).toBe(false);
  });
});
