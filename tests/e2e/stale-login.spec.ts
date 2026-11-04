// Tests a browser whose login cookie points to an account that no longer exists, as happens after the database is reset.
import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";
import { ADMIN, loginByForm } from "./helpers";

/** Gives the browser a correctly signed cookie for an account that does not exist. */
async function addStaleCookie(context: BrowserContext, baseURL: string | undefined): Promise<void> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
  const token = await new SignJWT({ name: "Old admin", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(randomUUID())
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
  await context.addCookies([{ name: "fw_session", value: token, url: baseURL ?? "" }]);
}

for (const address of ["/ar/admin", "/ar/badge", "/ar/coins", "/ar/admin/agenda"]) {
  test(`${address} asks a stale login to sign in, with no redirect loop`, async ({ context, page, baseURL }) => {
    await addStaleCookie(context, baseURL);
    await page.goto(address);
    await expect(page).toHaveURL(/\/ar\/login\?next=/);
    await expect(page.getByRole("button", { name: "دخول", exact: true })).toBeVisible();
  });
}

test("a stale login opens the register page instead of looping", async ({ context, page, baseURL }) => {
  await addStaleCookie(context, baseURL);
  await page.goto("/ar/register");
  await expect(page.getByRole("button", { name: "إنشاء الحساب" })).toBeVisible();
});

test("a stale login scanning a code is asked to sign in, not shown a server error", async ({ context, page, baseURL }) => {
  await addStaleCookie(context, baseURL);
  await page.goto("/scan/UQU-PIT-222222");
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
  await page.goto("/attend/UQU-GRID-222222");
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
});

test("the API tells a stale login to sign in again", async ({ context, page, baseURL }) => {
  await addStaleCookie(context, baseURL);
  await page.goto("/ar");
  const statuses = await page.evaluate(async () => {
    /** Posts one scanned code and returns the status. */
    const post = async (url: string) =>
      (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"token":"UQU-PIT-222222"}' })).status;
    return [await post("/api/coins/claim"), await post("/api/badges/claim"), await post("/api/attendance/check-in")];
  });
  expect(statuses).toEqual([401, 401, 401]);
});

test("an admin with a stale login signs in again and reaches the panel", async ({ context, page, baseURL }) => {
  await addStaleCookie(context, baseURL);
  await page.goto("/ar/admin");
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar\/admin$/);
  await expect(page.getByRole("link", { name: "البادجات" })).toBeVisible();
});
