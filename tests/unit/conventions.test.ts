// Enforces the project rules: file header comments, text only in config, and routes only in config.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_DIRS = ["src", "tests", "loadtest"];
const SOURCE_FILE = /\.(ts|tsx|css|js)$/;
const ARABIC = /[؀-ۿ]/;
const ROUTE_LITERAL =
  /["'`]\/(api|ar|en|login|register|agenda|map|badge|coins|admin|staff|scan|forgot-password|reset-password)(\/|["'`])/;
const TEXT_ALLOWED = ["src/config/", "src/db/sample-content.ts", "tests/"];
const ROUTES_ALLOWED = ["src/config/routes.ts", "tests/", "loadtest/"];

/** Lists every source file under a folder, skipping folders that do not exist. */
function listFiles(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listFiles(path);
    return SOURCE_FILE.test(path) ? [path] : [];
  });
}

const files = SOURCE_DIRS.flatMap(listFiles);

describe("project conventions", () => {
  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("starts every file with a comment", () => {
    const missing = files.filter((file) => !/^\s*(\/\/|\/\*)/.test(readFileSync(file, "utf8")));
    expect(missing).toEqual([]);
  });

  it("keeps Arabic text out of code files", () => {
    const allowed = (file: string) => TEXT_ALLOWED.some((prefix) => file.startsWith(prefix));
    const offenders = files.filter((file) => !allowed(file) && ARABIC.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("keeps route strings in the routes config", () => {
    const allowed = (file: string) => ROUTES_ALLOWED.some((prefix) => file.startsWith(prefix));
    const offenders = files.filter((file) => !allowed(file) && ROUTE_LITERAL.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
