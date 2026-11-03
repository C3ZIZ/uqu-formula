// Tests the limiter that stops password hashing from taking over the CPU.
import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/limiter";

/** Creates a task the test can finish on demand. */
function deferred() {
  /** Finishes the task. */
  let finish = () => {};
  const done = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return { done, finish };
}

describe("createLimiter", () => {
  it("never runs more than the limit at once", async () => {
    const limit = createLimiter(2);
    let running = 0;
    let peak = 0;
    const gates = Array.from({ length: 6 }, deferred);
    const jobs = gates.map((gate) =>
      limit(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await gate.done;
        running -= 1;
      }),
    );
    await Promise.resolve();
    expect(running).toBe(2);
    gates.forEach((gate) => gate.finish());
    await Promise.all(jobs);
    expect(peak).toBe(2);
    expect(running).toBe(0);
  });

  it("returns each task's own result", async () => {
    const limit = createLimiter(1);
    expect(await Promise.all([limit(async () => 1), limit(async () => 2)])).toEqual([1, 2]);
  });

  it("keeps working after a task fails", async () => {
    const limit = createLimiter(1);
    await expect(limit(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(await limit(async () => "ok")).toBe("ok");
  });

  it("starts waiting tasks in the order they arrived", async () => {
    const limit = createLimiter(1);
    const order: number[] = [];
    await Promise.all([1, 2, 3].map((value) => limit(async () => void order.push(value))));
    expect(order).toEqual([1, 2, 3]);
  });
});
