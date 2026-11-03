// Tests the main visitor journey at phone size in both languages.
import { expect, test } from "@playwright/test";
import { loginByForm, PASSWORD, registerByForm, uniqueEmail } from "./helpers";

test("the bare address opens in Arabic, right to left", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("a new visitor registers with Arabic digits and sees their badge", async ({ page }) => {
  await page.goto("/ar/register");
  await registerByForm(page, "سارة أحمد", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);
  await expect(page.getByRole("heading", { name: "سارة أحمد" })).toBeVisible();
  await expect(page.locator(".badge-qr svg")).toBeVisible();
  await expect(page.locator(".badge-code .numeric")).toHaveText(/^FW/);
});

test("invalid registration marks the fields and stays on the form", async ({ page }) => {
  await page.goto("/ar/register");
  await page.getByLabel("الاسم الكامل").fill("أ");
  await page.getByLabel("البريد الإلكتروني").fill("not-an-email");
  await page.getByLabel("رقم الجوال").fill("12");
  await page.getByLabel("كلمة المرور").fill("short");
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.getByText("اكتب بريدًا إلكترونيًا صحيحًا.")).toBeVisible();
  await expect(page.getByText("اكتب رقم جوال صحيحًا")).toBeVisible();
  await expect(page).toHaveURL(/\/ar\/register$/);
});

test("a second account with the same email in different case is refused", async ({ page, request }) => {
  const email = uniqueEmail();
  await request.post("/api/auth/register", { data: { name: "Sara", email, phone: "0501234567", password: PASSWORD } });
  await page.goto("/ar/register");
  await registerByForm(page, "سارة", email.toUpperCase());
  await expect(page.getByText("هذا البريد مسجل مسبقًا")).toBeVisible();
});

test("agenda days switch without leaving the page, and a session links to its map zone", async ({ page }) => {
  await page.goto("/ar/agenda");
  await expect(page.getByRole("heading", { name: "حفل الافتتاح" })).toBeVisible();
  await page.getByRole("tab", { name: /اليوم 3/ }).click();
  await expect(page.getByRole("heading", { name: "نهائي تحدي البيت ستوب" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "حفل الافتتاح" })).toBeHidden();
  await page.getByRole("link", { name: "تحدي البيت ستوب" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("نافس فريقك");
});

test("tapping a map zone opens its details, and the sheet closes", async ({ page }) => {
  await page.goto("/ar/map");
  await page.locator(".map-zone", { hasText: "المسرح الرئيسي" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("المسرح الرئيسي");
  await expect(sheet).toContainText("حفل الافتتاح");
  await sheet.getByRole("button", { name: "إغلاق" }).click();
  await expect(sheet).toBeHidden();
});

test("the language switch keeps the page and flips direction", async ({ page }) => {
  await page.goto("/ar/map");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/map$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Map", exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("no screen scrolls sideways on a phone", async ({ page }) => {
  for (const path of ["/ar", "/en", "/ar/agenda", "/en/agenda", "/ar/map", "/en/map", "/ar/login", "/en/register"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBe(0);
  }
});

test("a very long name stays on the badge without sideways scrolling", async ({ page }) => {
  await page.goto("/ar/register");
  await registerByForm(page, "عبدالرحمن".repeat(9), uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

test("logging out closes the badge", async ({ page }) => {
  await page.goto("/ar/register");
  await registerByForm(page, "سارة", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);
  await page.getByRole("button", { name: "تسجيل الخروج" }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/badge");
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
});

test("login never redirects to another website", async ({ page, request }) => {
  const email = uniqueEmail();
  await request.post("/api/auth/register", { data: { name: "Sara", email, phone: "0501234567", password: PASSWORD } });
  await page.context().clearCookies();
  await page.goto("/ar/login?next=https://evil.example/phish");
  await loginByForm(page, email, PASSWORD);
  await expect(page).toHaveURL(/\/ar$/);
});

test("a wrong password shows a clear message", async ({ page }) => {
  await page.goto("/ar/login");
  await loginByForm(page, "nobody@example.com", "wrong-password");
  await expect(page.locator(".form-error")).toContainText("غير صحيحة");
});

test("the unknown page screen offers a way back", async ({ page }) => {
  const response = await page.goto("/ar/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "العودة للرئيسية" })).toBeVisible();
});

test("shared links carry a real preview image and description", async ({ page, request }) => {
  await page.goto("/ar");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toContain("/og.jpg");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /الفورميلا/);
  const response = await request.get("/og.jpg");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/jpeg");
});

test("times never wrap inside the map sheet", async ({ page }) => {
  await page.goto("/ar/map");
  await page.locator(".map-zone", { hasText: "المسرح الرئيسي" }).click();
  const time = page.getByRole("dialog").locator(".sheet-session .numeric").first();
  const box = await time.boundingBox();
  const lineHeight = await time.evaluate((node) => parseFloat(getComputedStyle(node).fontSize) * 2);
  expect(box?.height ?? 99).toBeLessThan(lineHeight);
});
