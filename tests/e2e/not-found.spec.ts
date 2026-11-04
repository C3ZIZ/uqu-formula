// Tests the off-track not-found page for every kind of unknown address.
import { expect, test } from "@playwright/test";

test.describe("unknown addresses", () => {
  for (const address of ["/xyz", "/ar/xyz", "/ar/admin/none/none"]) {
    test(`${address} shows the off-track page in Arabic`, async ({ page }) => {
      const response = await page.goto(address);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "خرجت عن المسار" })).toBeVisible();
      await expect(page.locator(".off-track-scene svg")).toBeVisible();
      await page.getByRole("link", { name: "العودة إلى المسار" }).click();
      await expect(page).toHaveURL(/\/ar$/);
    });
  }

  test("an English address shows English text", async ({ page }) => {
    const response = await page.goto("/en/xyz");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "You went off track" })).toBeVisible();
    await page.getByRole("link", { name: "Back on track" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });
});

test("the car moves normally, and stays parked for people who reduce motion", async ({ browser, baseURL }) => {
  const moving = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const movingPage = await moving.newPage();
  await movingPage.goto("/ar/xyz");
  await expect(movingPage.locator(".off-track-live")).toBeVisible();
  await expect(movingPage.locator(".off-track-still")).toBeHidden();
  await moving.close();

  const still = await browser.newContext({ baseURL, ignoreHTTPSErrors: true, reducedMotion: "reduce" });
  const stillPage = await still.newPage();
  await stillPage.goto("/ar/xyz");
  await expect(stillPage.locator(".off-track-still")).toBeVisible();
  await expect(stillPage.locator(".off-track-live")).toBeHidden();
  await still.close();
});
