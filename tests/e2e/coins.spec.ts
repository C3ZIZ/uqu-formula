// Tests earning coins: logged-out scans, repeat scans, typed codes, and switched-off codes.
import { expect, test } from "@playwright/test";
import { createCode, loginByForm, PASSWORD, registerByApi, registerByForm, uniqueEmail } from "./helpers";

test("a logged-out visitor registers from a coin link, returns, and earns the coins once", async ({ page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const code = await createCode(admin, 75);

  await page.goto(`/scan/${code.token}`);
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
  await page.getByRole("link", { name: "ليس لديك حساب" }).click();
  await registerByForm(page, "نورة", uniqueEmail());

  await expect(page).toHaveURL(new RegExp(`/ar/scan/${code.token}$`));
  await expect(page.locator(".claim-coins")).toContainText("75");

  await page.reload();
  await expect(page.getByRole("heading", { name: "جمعت هذا الكود من قبل" })).toBeVisible();
  await expect(page.locator(".claim-total")).toContainText("75");
  await admin.dispose();
});

test("a logged-out visitor logs in from a coin link and returns", async ({ page, request, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const code = await createCode(admin, 20);
  const email = await registerByApi(request);

  await page.goto(`/scan/${code.token}`);
  await loginByForm(page, email, PASSWORD);
  await expect(page).toHaveURL(new RegExp(`/ar/scan/${code.token}$`));
  await expect(page.locator(".claim-coins")).toContainText("20");
  await admin.dispose();
});

test("simultaneous claims from one session count once", async ({ page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const code = await createCode(admin, 40);
  await page.goto("/ar/register");
  await registerByForm(page, "ليان", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);

  const statuses = await page.evaluate(async (token) => {
    const replies = await Promise.all(
      Array.from({ length: 10 }, () =>
        fetch("/api/coins/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).then((response) => response.json()),
      ),
    );
    return replies.map((reply) => reply.status);
  }, code.token);

  expect(statuses.filter((status) => status === "claimed")).toHaveLength(1);
  await page.goto("/ar/coins");
  await expect(page.locator(".coins-total .numeric")).toHaveText("40");
  await admin.dispose();
});

test("a visitor without camera access can type a code, and history updates", async ({ page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const code = await createCode(admin, 15);
  await page.goto("/ar/register");
  await registerByForm(page, "ريم", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);

  await page.goto("/ar/coins");
  await page.getByRole("button", { name: "امسح", exact: true }).click();
  await expect(page.getByText("لم نتمكن من فتح الكاميرا")).toBeVisible();
  await page.getByLabel("أو اكتب الرمز").fill("nonsense code!");
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.getByText("لم نتعرف على هذا الكود.")).toBeVisible();
  await page.getByLabel("أو اكتب الرمز").fill(code.token.toLowerCase());
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.locator(".claim-coins")).toContainText("15");

  await page.getByRole("link", { name: "إلى الكوينز" }).click();
  await expect(page.locator(".coins-total .numeric")).toHaveText("15");
  await expect(page.getByText("ورشة تجريبية")).toBeVisible();
  await admin.dispose();
});

test("a switched-off or unknown code earns nothing", async ({ page, playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const code = await createCode(admin, 30);
  await admin.put(`/api/admin/coin-codes/${code.id}`, {
    data: { labelAr: "ورشة", labelEn: "Workshop", coins: 30, isActive: false },
  });
  await page.goto("/ar/register");
  await registerByForm(page, "هند", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);

  await page.goto(`/ar/scan/${code.token}`);
  await expect(page.getByRole("heading", { name: "هذا الكود غير صالح" })).toBeVisible();
  await page.goto("/ar/scan/NOSUCHCODE22");
  await expect(page.getByRole("heading", { name: "هذا الكود غير صالح" })).toBeVisible();
  await admin.dispose();
});

test("requests from another website are refused", async ({ request }) => {
  const response = await request.post("/api/coins/claim", {
    headers: { origin: "https://evil.example" },
    data: { token: "ANYTHING" },
  });
  expect([401, 403]).toContain(response.status());
  const registered = await request.post("/api/auth/login", {
    headers: { origin: "https://evil.example" },
    data: { email: "a@example.com", password: "x" },
  });
  expect(registered.status()).toBe(403);
});
