// Tests daily attendance QR codes from the admin panel through to a visitor scanning at the door.
import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";
import { ADMIN, createPlace, loginAdminApi, loginByForm, PASSWORD, registerByApi, registerByForm, uniqueEmail } from "./helpers";

/** Returns today's date at the venue. */
function riyadhToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

/** Returns the token of today's code, creating it first if needed. */
async function todayToken(browser: Browser, admin: APIRequestContext, baseURL: string | undefined): Promise<string> {
  const today = riyadhToday();
  const created = await admin.post("/api/admin/attendance-codes", { data: { eventDate: today, zoneId: await createPlace(admin) } });
  if (created.ok()) return (await created.json()).token;
  const context = await browser.newContext({ baseURL, ignoreHTTPSErrors: true, storageState: await admin.storageState() });
  const page = await context.newPage();
  await page.goto("/ar/admin/attendance-codes");
  const token = await page.locator(".resource-list li", { hasText: today }).locator(".code-token").textContent();
  await context.close();
  return token ?? "";
}

test("an admin creates a daily code in the panel and prints it, and a repeat date is refused", async ({ page }) => {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/attendance-codes");
  await page.getByRole("button", { name: "إضافة" }).click();
  await page.getByLabel("التاريخ").fill("2031-03-14");
  await page.getByRole("button", { name: "حفظ" }).click();

  const row = page.locator(".resource-list li", { hasText: "2031" });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: "طباعة" }).click();
  await expect(page.locator(".print-qr svg")).toBeVisible();

  await page.goto("/ar/admin/attendance-codes");
  await page.getByRole("button", { name: "إضافة" }).click();
  await page.getByLabel("التاريخ").fill("2031-03-14");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.locator(".form-error")).toContainText("يوجد كود لهذا اليوم");

  await page.goto("/ar/admin/attendance-codes");
  const saved = page.locator(".resource-list li", { hasText: "2031" });
  await saved.getByRole("button", { name: "حذف" }).click();
  await saved.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".resource-list")).not.toContainText("2031");
});

test("a logged-out visitor scans the door code, registers, returns, and is checked in once", async ({ browser, page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  await loginAdminApi(admin);
  const reply = await admin.post("/api/admin/attendance-codes", { data: { eventDate: "2031-05-01", zoneId: await createPlace(admin) } });
  expect(reply.status()).toBe(201);
  const future = await reply.json();
  const token = await todayToken(browser, admin, baseURL);

  await page.goto(`/attend/${token}`);
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
  await page.getByRole("link", { name: "ليس لديك حساب" }).click();
  await registerByForm(page, "زائرة الحضور", uniqueEmail());
  await expect(page).toHaveURL(new RegExp(`/ar/attend/${token}$`));
  await expect(page.getByRole("heading", { name: "تم تسجيل حضورك" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "سجلت حضورك اليوم مسبقًا" })).toBeVisible();

  await page.goto("/ar/badge");
  await expect(page.locator(".badge-status")).toContainText("سُجل حضورك");

  await page.goto(`/ar/attend/${future.token}`);
  await expect(page.getByRole("heading", { name: "هذا الكود ليوم آخر" })).toBeVisible();

  await admin.delete(`/api/admin/attendance-codes/${future.id}`);
  await admin.dispose();
});

test("the middle scan button handles a typed attendance code and alerts once", async ({ browser, page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  await loginAdminApi(admin);
  const token = await todayToken(browser, admin, baseURL);
  await page.goto("/ar/register");
  await registerByForm(page, "زائر الزر", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);

  await page.getByRole("button", { name: "امسح", exact: true }).click();
  await page.getByLabel("أو اكتب الرمز").fill(token.toLowerCase());
  await page.getByRole("button", { name: "تأكيد" }).click();

  await expect(page).toHaveURL(new RegExp(`/ar/attend/${token}$`));
  await expect(page.getByRole("heading", { name: "تم تسجيل حضورك" })).toBeVisible();
  await expect(page.locator(".toast")).toContainText("تم تسجيل حضورك");
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.reload();
  await expect(page.getByRole("heading", { name: "سجلت حضورك اليوم مسبقًا" })).toBeVisible();
  await expect(page.locator(".toast")).toHaveCount(0);
  await admin.dispose();
});

test("logging in alone does not record attendance", async ({ page, request }) => {
  const email = await registerByApi(request);
  await page.context().clearCookies();
  await page.goto("/ar/login");
  await loginByForm(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator(".toast")).toHaveCount(0);
  await page.goto("/ar/badge");
  await expect(page.locator(".badge-status")).toContainText("لم يُسجل حضورك");
  await expect(page.locator(".badge-status")).toContainText("زر التصوير");
});

test("the scan button works for logged-out visitors and closes after a read", async ({ page }) => {
  await page.goto("/ar/agenda");
  await page.getByRole("button", { name: "امسح", exact: true }).click();
  await page.getByLabel("أو اكتب الرمز").fill("uqu-pit-222222");
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the bottom bar has five items with scanning in the middle", async ({ page }) => {
  await page.goto("/ar");
  const items = page.locator(".bottom-nav > ul > li");
  await expect(items).toHaveCount(5);
  await expect(items.nth(2).getByRole("button", { name: "امسح", exact: true })).toBeVisible();
  const box = await items.nth(2).getByRole("button", { name: "امسح", exact: true }).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await page.getByRole("link", { name: "أسبوع الفورميلا" }).click();
  await expect(page).toHaveURL(/\/ar$/);
});

test("visitors cannot manage attendance codes", async ({ request }) => {
  await registerByApi(request);
  const created = await request.post("/api/admin/attendance-codes", { data: { eventDate: "2031-06-01", zoneId: "00000000-0000-4000-8000-000000000000" } });
  expect(created.status()).toBe(403);
});

test("a code on a date outside the event warns that it does not count toward the all-days badge", async ({ page }) => {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/attendance-codes");
  await page.getByRole("button", { name: "إضافة" }).click();
  const warning = page.locator(".resource-form .form-note");
  await page.getByLabel("التاريخ").fill("2026-12-13");
  await expect(warning).toHaveCount(0);
  await page.getByLabel("التاريخ").fill("2034-02-02");
  await expect(warning).toContainText("ليس من أيام الفعالية");
  await page.getByRole("button", { name: "حفظ" }).click();
  const row = page.locator(".resource-list li", { hasText: "2034-02-02" });
  await expect(row).toContainText("ليس من أيام الفعالية");
  await row.getByRole("button", { name: "حذف" }).click();
  await row.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".resource-list")).not.toContainText("2034-02-02");
});

