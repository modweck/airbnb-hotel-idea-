import { describe, expect, test } from "vitest";
import { splitPerPerson } from "@/lib/split";

describe("splitPerPerson", () => {
  test("even split across a group", () => {
    expect(splitPerPerson(1600, 8)).toBe(200);
  });

  test("split with remainder rounds to cents", () => {
    expect(splitPerPerson(100, 3)).toBe(33.33);
  });

  test("split with remainder rounds half up", () => {
    expect(splitPerPerson(10, 3)).toBe(3.33);
    expect(splitPerPerson(20, 3)).toBe(6.67);
  });

  test("single person owes the full amount", () => {
    expect(splitPerPerson(800, 1)).toBe(800);
  });

  test("zero people returns 0 (no divide-by-zero)", () => {
    expect(splitPerPerson(800, 0)).toBe(0);
  });

  test("negative people returns 0", () => {
    expect(splitPerPerson(800, -1)).toBe(0);
  });

  test("zero total returns 0", () => {
    expect(splitPerPerson(0, 8)).toBe(0);
  });

  test("negative total works (refund use case)", () => {
    expect(splitPerPerson(-100, 4)).toBe(-25);
  });

  test("NaN total returns 0", () => {
    expect(splitPerPerson(NaN, 8)).toBe(0);
  });

  test("NaN people returns 0", () => {
    expect(splitPerPerson(800, NaN)).toBe(0);
  });

  test("Infinity returns 0", () => {
    expect(splitPerPerson(Infinity, 8)).toBe(0);
    expect(splitPerPerson(800, Infinity)).toBe(0);
  });

  test("large groups", () => {
    expect(splitPerPerson(1_000_000, 100_000)).toBe(10);
  });

  test("decimal totals", () => {
    expect(splitPerPerson(99.99, 3)).toBe(33.33);
  });
});
