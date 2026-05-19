import { describe, expect, test } from "vitest";
import { nightsBetween } from "@/lib/duration";

describe("nightsBetween", () => {
  test("one night between consecutive days", () => {
    expect(nightsBetween("2026-05-19", "2026-05-20")).toBe(1);
  });

  test("three-night stay", () => {
    expect(nightsBetween("2026-05-19", "2026-05-22")).toBe(3);
  });

  test("a full week", () => {
    expect(nightsBetween("2026-05-19", "2026-05-26")).toBe(7);
  });

  test("same day returns zero", () => {
    expect(nightsBetween("2026-05-19", "2026-05-19")).toBe(0);
  });

  test("crosses end of month", () => {
    expect(nightsBetween("2026-05-31", "2026-06-02")).toBe(2);
  });

  test("crosses end of year", () => {
    expect(nightsBetween("2026-12-31", "2027-01-02")).toBe(2);
  });

  test("crosses leap-year February", () => {
    expect(nightsBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  test("crosses spring DST in US (March)", () => {
    // DST jumps the clock forward one hour. UTC parsing keeps it at 1 night.
    expect(nightsBetween("2026-03-07", "2026-03-08")).toBe(1);
    expect(nightsBetween("2026-03-08", "2026-03-09")).toBe(1);
  });

  test("crosses fall DST in US (November)", () => {
    expect(nightsBetween("2026-11-01", "2026-11-02")).toBe(1);
  });

  test("reversed range returns zero", () => {
    expect(nightsBetween("2026-05-22", "2026-05-19")).toBe(0);
  });

  test("invalid checkIn string returns zero", () => {
    expect(nightsBetween("not-a-date", "2026-05-22")).toBe(0);
  });

  test("invalid checkOut string returns zero", () => {
    expect(nightsBetween("2026-05-19", "garbage")).toBe(0);
  });

  test("accepts Date objects", () => {
    const start = new Date("2026-05-19T00:00:00Z");
    const end = new Date("2026-05-22T00:00:00Z");
    expect(nightsBetween(start, end)).toBe(3);
  });

  test("ignores time portion of ISO strings", () => {
    expect(nightsBetween("2026-05-19T15:00:00", "2026-05-22T09:00:00")).toBe(3);
  });

  test("long stay (one year)", () => {
    expect(nightsBetween("2026-01-01", "2027-01-01")).toBe(365);
  });

  test("invalid Date object returns zero", () => {
    expect(nightsBetween(new Date("invalid"), "2026-05-22")).toBe(0);
  });
});
