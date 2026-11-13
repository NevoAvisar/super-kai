import { describe, expect, it } from "vitest";
import { createMemoryLikeStore } from "./like-store";

describe("memory like store", () => {
  it("counts one like per visitor and is idempotent", async () => {
    const store = createMemoryLikeStore();
    expect(await store.set("brisket", "v1", true)).toBe(1);
    expect(await store.set("brisket", "v1", true)).toBe(1);
    expect(await store.set("brisket", "v2", true)).toBe(2);
    expect(await store.set("brisket", "v1", false)).toBe(1);
    expect(await store.set("brisket", "v1", false)).toBe(1);
  });

  it("summarises counts and the visitor's own likes", async () => {
    const store = createMemoryLikeStore();
    await store.set("a", "v1", true);
    await store.set("a", "v2", true);
    await store.set("b", "v2", true);
    expect(await store.summary(["a", "b", "c"], "v1")).toEqual({ counts: { a: 2, b: 1 }, mine: ["a"] });
    expect(await store.summary(["a", "b"], null)).toEqual({ counts: { a: 2, b: 1 }, mine: [] });
  });
});
