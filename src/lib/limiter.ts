// Limits how many slow tasks run at once, so the rest wait in line instead of slowing everything.

/** Creates a function that runs tasks with at most the given number at the same time. */
export function createLimiter(maxRunning: number) {
  let running = 0;
  const waiting: (() => void)[] = [];

  /** Runs one task once a slot is free. */
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (running >= maxRunning) await new Promise<void>((resolve) => waiting.push(resolve));
    else running += 1;
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else running -= 1;
    }
  };
}
