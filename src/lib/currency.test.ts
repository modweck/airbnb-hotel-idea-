import { describe, expect, test } from "vitest";
import { formatMoney } from "@/lib/currency";

describe("formatMoney", () => {
  test("formats whole dollars with no decimals by default", () => {
    expect(formatMoney(1234)).toBe("$1,234");
  });

  test("rounds to the nearest dollar by default", () => {
    expect(formatMoney(1234.5)).toBe("$1,235");
    expect(formatMoney(1234.49)).toBe("$1,234");
  });

  test("preserves cents when cents option is true", () => {
    expect(formatMoney(1234.56, { cents: true })).toBe("$1,234.56");
  });

  test("pads to two decimal places when cents is true", () => {
    expect(formatMoney(1234, { cents: true })).toBe("$1,234.00");
    expect(formatMoney(1234.5, { cents: true })).toBe("$1,234.50");
  });

  test("formats zero", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(0, { cents: true })).toBe("$0.00");
  });

  test("formats negative amounts", () => {
    expect(formatMoney(-100)).toBe("-$100");
  });

  test("handles thousands separators for large numbers", () => {
    expect(formatMoney(1_000_000)).toBe("$1,000,000");
  });

  test("returns em-dash for NaN", () => {
    expect(formatMoney(NaN)).toBe("—");
  });

  test("returns em-dash for Infinity", () => {
    expect(formatMoney(Infinity)).toBe("—");
    expect(formatMoney(-Infinity)).toBe("—");
  });

  test("respects custom currency code", () => {
    expect(formatMoney(100, { currency: "EUR" })).toBe("€100");
  });
});
