// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { kvStore } from "./kv-store.web";

beforeEach(() => localStorage.clear());

describe("kvStore (web)", () => {
  it("round-trips a string value", async () => {
    await kvStore.setItem("k", "v");
    expect(await kvStore.getItem("k")).toBe("v");
  });

  it("returns null for missing key", async () => {
    expect(await kvStore.getItem("missing")).toBeNull();
  });

  it("removes a value", async () => {
    await kvStore.setItem("k", "v");
    await kvStore.removeItem("k");
    expect(await kvStore.getItem("k")).toBeNull();
  });
});
