// Shared end-to-end helpers: unique visitors, API sign-in, and admin-created coin codes.
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const ADMIN = {
  email: process.env.SEED_ADMIN_EMAIL ?? "",
  password: process.env.SEED_ADMIN_PASSWORD ?? "",
};
export const PASSWORD = "password-123";

/** Creates a unique email for a test visitor. */
export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;
}

/** Registers a visitor through the Arabic form. */
export async function registerByForm(page: Page, name: string, email: string): Promise<void> {
  await page.getByLabel("الاسم الكامل").fill(name);
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("رقم الجوال").fill("٠٥٠١٢٣٤٥٦٧");
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
}

/** Logs in through the Arabic form. */
export async function loginByForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
}

/** Registers a visitor directly through the API and returns the email. */
export async function registerByApi(request: APIRequestContext, name = "زائر تجريبي"): Promise<string> {
  const email = uniqueEmail();
  const response = await request.post("/api/auth/register", {
    data: { name, email, phone: "0501234567", password: PASSWORD },
  });
  expect(response.status()).toBe(201);
  return email;
}

/** Logs this request context in as the admin. */
export async function loginAdminApi(request: APIRequestContext): Promise<void> {
  const response = await request.post("/api/auth/login", { data: ADMIN });
  expect(response.ok()).toBe(true);
}

/** Creates a coin code as the admin and returns its token and id. */
export async function createCode(request: APIRequestContext, coins = 50): Promise<{ id: string; token: string }> {
  await loginAdminApi(request);
  const response = await request.post("/api/admin/coin-codes", {
    data: { labelAr: "ورشة تجريبية", labelEn: "Test workshop", coins, isActive: true },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
