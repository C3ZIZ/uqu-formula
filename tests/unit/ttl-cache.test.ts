// Tests the short-lived content cache.
import { describe, expect, it } from "vitest";
import { createTtlCache } from "@/lib/ttl-cache";

describe("createTtlCache", () => {
  it("makes one load for many simultaneous readers", async () => {
    let loads = 0;
    const cache = createTtlCache(async () => ++loads, 1000);
    const values = await Promise.all([cache.get(), cache.get(), cache.get()]);
    expect(values).toEqual([1, 1, 1]);
    expect(loads).toBe(1);
  });

  it("reloads after the time limit", async () => {
    let loads = 0;
    let now = 0;
    const cache = createTtlCache(async () => ++loads, 1000, () => now);
    await cache.get();
    now = 1001;
    expect(await cache.get()).toBe(2);
  });

  it("reloads after invalidate", async () => {
    let loads = 0;
    const cache = createTtlCache(async () => ++loads, 1000);
    await cache.get();
    cache.invalidate();
    expect(await cache.get()).toBe(2);
  });

  it("retries on the next read after a failed load", async () => {
    let loads = 0;
    const cache = createTtlCache(async () => {
      loads += 1;
      if (loads === 1) throw new Error("down");
      return "ok";
    }, 1000);
    await expect(cache.get()).rejects.toThrow("down");
    expect(await cache.get()).toBe("ok");
  });
});
