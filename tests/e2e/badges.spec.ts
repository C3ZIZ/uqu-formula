// Tests badges from the admin panel through to a visitor earning them.
import { expect, test, type Page } from "@playwright/test";
import { ADMIN, loginByForm } from "./helpers";

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
