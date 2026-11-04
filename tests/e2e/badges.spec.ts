// Tests badges from the admin panel through to a visitor earning them.
import { expect, test, type Page } from "@playwright/test";
import { ADMIN, loginAdminApi, loginByForm, registerByForm, uniqueEmail } from "./helpers";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==",
  "base64",
);

/** Logs the admin in and opens the badges screen. */
async function openBadges(page: Page): Promise<void> {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/badges");
}

test("an admin creates a challenge badge with an icon, adds an image, prints it, and switches it off", async ({ page }) => {
  await openBadges(page);
  await page.getByRole("button", { name: "إضافة" }).click();
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByText("راجع الحقول المحددة.")).toBeVisible();

  const name = `بطل ${Date.now()}`;
  await page.getByLabel("الاسم بالعربية").fill(name);
  await page.getByLabel("الاسم بالإنجليزية").fill("Champion");
  await page.getByLabel("وصف التحدي بالعربية").fill("غيّر الإطارات في ١٠ ثوان");
  await page.getByLabel("وصف التحدي بالإنجليزية").fill("Change the tires in 10 seconds");
  await page.getByRole("radio", { name: "علم" }).check({ force: true });
  await page.getByRole("button", { name: "حفظ" }).click();

  const row = page.locator(".resource-list li", { hasText: name });
  await expect(row.locator(".code-token")).toHaveText(/^UQU-PODIUM-/);
  await expect(row.locator(".badge-medal svg")).toBeVisible();

  await row.getByRole("button", { name: "تعديل" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "badge.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.locator(".badge-image-preview")).toBeVisible();
  await page.getByRole("button", { name: "حفظ" }).click();
  const saved = page.locator(".resource-list li", { hasText: name });
  await expect(saved.locator(".badge-medal img")).toBeVisible();

  await saved.getByRole("link", { name: "طباعة" }).click();
  await expect(page.locator(".print-qr svg")).toBeVisible();
  await expect(page.locator(".print-sheet")).toContainText(name);
  await page.goto("/ar/admin/badges");

  await saved.getByRole("button", { name: "إيقاف" }).click();
  await expect(saved).toContainText("موقوف");

  await saved.getByRole("button", { name: "حذف" }).click();
  await saved.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".resource-list")).not.toContainText(name);
});

test("visitors cannot manage badges", async ({ page, request }) => {
  expect((await request.post("/api/admin/badges", { data: {} })).status()).toBe(401);
  await page.goto("/ar/admin/badges");
  await expect(page).toHaveURL(/\/ar\/login/);
});

test("a visitor sees a challenge, scans its badge once, and then sees it earned", async ({ browser, page, baseURL, playwright }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  await loginAdminApi(admin);
  const name = `تحدي البيت ستوب ${Date.now()}`;
  const created = await admin.post("/api/admin/badges", {
    data: { kind: "challenge", nameAr: name, nameEn: "Pit stop", challengeAr: "غيّر الإطارات", challengeEn: "Change the tires", icon: "flag", isActive: true },
  });
  expect(created.status()).toBe(201);
  const badge = await created.json();

  await page.goto("/ar/register");
  await registerByForm(page, "زائر البادج", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);
  await expect(page.locator(".badge-qr svg")).toBeVisible();

  await page.goto("/ar/coins");
  const row = page.locator(".visitor-badge", { hasText: name });
  await expect(row).toContainText("غيّر الإطارات");
  await expect(row.locator(".badge-medal--locked")).toBeVisible();

  await page.getByRole("button", { name: "امسح" }).click();
  await page.getByLabel("أو اكتب الرمز").fill(badge.token.toLowerCase());
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.locator(".toast")).toContainText("حصلت على بادج");
  await expect(page.locator(".claim")).toContainText(name);

  await page.goto("/ar/coins");
  await expect(row.locator(".badge-medal--locked")).toHaveCount(0);
  await expect(row).toContainText("حصلت عليه");

  await page.goto(`/scan/${badge.token}`);
  await expect(page.locator(".claim")).toContainText("حصلت على هذا البادج من قبل");
  await expect(page.locator(".toast")).toHaveCount(0);

  await admin.put(`/api/admin/badges/${badge.id}`, {
    data: { nameAr: name, nameEn: "Pit stop", challengeAr: "غيّر الإطارات", challengeEn: "Change the tires", icon: "flag", isActive: false },
  });
  const otherContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const other = await otherContext.newPage();
  await other.goto("/ar/register");
  await registerByForm(other, "زائر آخر", uniqueEmail());
  await expect(other).toHaveURL(/\/ar\/badge$/);
  await other.goto(`/scan/${badge.token}`);
  await expect(other.locator(".claim")).toContainText("هذا الكود غير صالح");
  await other.goto("/ar/coins");
  await expect(other.locator(".visitor-badge", { hasText: name })).toHaveCount(0);
  await otherContext.close();
  await admin.dispose();
});

test("the badge form uploads the picture once, and shows keyboard focus on the picker", async ({ page }) => {
  await openBadges(page);
  await page.getByRole("button", { name: "إضافة" }).click();
  await page.getByLabel("الاسم بالعربية").fill(`صورة ${Date.now()}`);
  await page.getByLabel("الاسم بالإنجليزية").fill("Picture");
  await page.getByLabel("وصف التحدي بالعربية").fill("تحدي");
  await page.getByLabel("وصف التحدي بالإنجليزية").fill("Challenge");
  await page.locator('input[type="file"]').setInputFiles({ name: "badge.png", mimeType: "image/png", buffer: TINY_PNG });
  await expect(page.locator(".badge-image-preview")).toBeVisible();

  const [request] = await Promise.all([
    page.waitForRequest((sent) => sent.method() === "POST" && sent.url().endsWith("/api/admin/badges")),
    page.getByRole("button", { name: "حفظ" }).click(),
  ]);
  const body = request.postDataJSON();
  expect(body.image).toBeTruthy();
  expect(body).not.toHaveProperty("previewUrl");

  await page.getByRole("button", { name: "إضافة" }).click();
  await page.locator(".icon-choice input").first().focus();
  for (let press = 0; press < 3; press += 1) {
    await page.keyboard.press("Tab");
    if (await page.locator('input[type="file"]').evaluate((input) => input === document.activeElement)) break;
  }
  await expect(page.locator('input[type="file"]')).toBeFocused();
  const outline = await page.locator(".badge-image-pick").evaluate((label) => getComputedStyle(label).outlineStyle);
  expect(outline).toBe("solid");
});

test("a failed on-off switch tells the admin, and only sends the switch", async ({ page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  await loginAdminApi(admin);
  const name = `مفتاح ${Date.now()}`;
  const created = await admin.post("/api/admin/badges", {
    data: { kind: "challenge", nameAr: name, nameEn: "Switch", challengeAr: "تحدي", challengeEn: "Challenge", icon: "flag", isActive: true },
  });
  expect(created.status()).toBe(201);
  await openBadges(page);
  const row = page.locator(".resource-list li", { hasText: name });

  await page.route("**/api/admin/badges/*", (route) => route.abort());
  await row.getByRole("button", { name: "إيقاف" }).click();
  await expect(page.locator(".form-error")).toContainText("تعذر الاتصال");
  await page.unroute("**/api/admin/badges/*");

  const [request] = await Promise.all([
    page.waitForRequest((sent) => sent.url().includes("/api/admin/badges/")),
    row.getByRole("button", { name: "إيقاف" }).click(),
  ]);
  expect(request.method()).toBe("PATCH");
  expect(request.postDataJSON()).toEqual({ isActive: false });
  await expect(row).toContainText("موقوف");
  await admin.delete(`/api/admin/badges/${(await created.json()).id}`);
  await admin.dispose();
});

