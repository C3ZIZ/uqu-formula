// Tests staff check-in, the admin panel, roles, CSV export, and password reset.
import { expect, test } from "@playwright/test";
import { ADMIN, loginByForm, registerByApi, registerByForm, uniqueEmail } from "./helpers";

const MAILPIT = "http://localhost:8025/api/v1";

test("visitors cannot open the admin panel or its API", async ({ page, request }) => {
  await page.goto("/ar/register");
  await registerByForm(page, "زائر", uniqueEmail());
  await expect(page).toHaveURL(/\/ar\/badge$/);
  await page.goto("/ar/admin");
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/staff/check-in");
  await expect(page).toHaveURL(/\/ar$/);
  const status = await page.evaluate(async () => (await fetch("/api/admin/registrants/csv")).status);
  expect(status).toBe(403);
  expect((await request.get("/api/admin/registrants/csv")).status()).toBe(401);
});

test("an admin creates a coin code in the panel, and a visitor can claim it", async ({ browser, page, baseURL }) => {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.getByRole("link", { name: "الإدارة" }).click();
  await page.getByRole("link", { name: "أكواد الكوينز" }).click();
  await page.getByRole("button", { name: "إضافة" }).click();
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByText("راجع الحقول المحددة.")).toBeVisible();

  const label = `كود ${Date.now()}`;
  await page.getByLabel("الوصف بالعربية").fill(label);
  await page.getByLabel("الوصف بالإنجليزية").fill("Panel code");
  await page.getByLabel("عدد الكوينز").fill("120");
  await page.getByRole("button", { name: "حفظ" }).click();

  const row = page.locator(".resource-list li", { hasText: label });
  await expect(row).toContainText("120");
  const token = (await row.locator(".code-token").textContent()) ?? "";
  await row.getByRole("link", { name: "طباعة" }).click();
  await expect(page.locator(".print-qr svg")).toBeVisible();
  await expect(page.locator(".print-sheet")).toContainText(token);

  const visitorContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const visitor = await visitorContext.newPage();
  await visitor.goto("/ar/register");
  await registerByForm(visitor, "سلمى", uniqueEmail());
  await expect(visitor).toHaveURL(/\/ar\/badge$/);
  await visitor.goto(`/scan/${token}`);
  await expect(visitor.locator(".claim-coins")).toContainText("120");
  await visitorContext.close();

  await page.goto("/ar/admin/coin-codes");
  const claimed = page.locator(".resource-list li", { hasText: label });
  await claimed.getByRole("button", { name: "حذف" }).click();
  await claimed.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".form-error")).toContainText("لا يمكن حذفه");
});

test("an admin edits the agenda and the change reaches visitors", async ({ page }) => {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/agenda");
  await page.getByRole("button", { name: "إضافة" }).click();
  const title = `فقرة ${Date.now()}`;
  await page.getByLabel("العنوان بالعربية").fill(title);
  await page.getByLabel("العنوان بالإنجليزية").fill("New session");
  await page.getByLabel("يبدأ").fill("18:00");
  await page.getByLabel("ينتهي").fill("17:00");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByText("القيمة غير صحيحة.")).toBeVisible();
  await page.getByLabel("ينتهي").fill("19:00");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.locator(".resource-list")).toContainText(title);

  await expect(async () => {
    await page.goto("/ar/agenda");
    await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 40_000 });

  await page.goto("/ar/admin/agenda");
  const row = page.locator(".resource-list li", { hasText: title });
  await row.getByRole("button", { name: "حذف" }).click();
  await row.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".resource-list")).not.toContainText(title);
});

test("an admin places a new zone by tapping the map", async ({ page }) => {
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/zones");
  await page.getByRole("button", { name: "إضافة" }).click();
  const name = `منطقة ${Date.now()}`;
  await page.getByLabel("الاسم بالعربية").fill(name);
  await page.getByLabel("الاسم بالإنجليزية").fill("Temp zone");
  const before = await page.locator(".placement-current").evaluate((node) => (node as HTMLElement).style.top);
  await page.locator(".placement").click({ position: { x: 150, y: 300 } });
  await expect
    .poll(() => page.locator(".placement-current").evaluate((node) => (node as HTMLElement).style.top))
    .not.toBe(before);
  await page.getByRole("button", { name: "حفظ" }).click();
  const row = page.locator(".resource-list li", { hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "حذف" }).click();
  await row.getByRole("button", { name: "اضغط مرة أخرى للتأكيد" }).click();
  await expect(page.locator(".resource-list")).not.toContainText(name);
});

test("staff check in a visitor once per day, and the badge and totals update", async ({ browser, page, baseURL }) => {
  const visitorContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const visitor = await visitorContext.newPage();
  await visitor.goto("/ar/register");
  const name = `حاضر ${Date.now()}`;
  await registerByForm(visitor, name, uniqueEmail());
  await expect(visitor).toHaveURL(/\/ar\/badge$/);
  await expect(visitor.getByRole("status")).toContainText("لم يُسجل حضورك");
  const badgeCode = (await visitor.locator(".badge-code .numeric").textContent()) ?? "";

  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.getByRole("link", { name: "تسجيل الحضور" }).click();
  const countBefore = Number(await page.locator(".desk-count .numeric").textContent());
  await page.getByRole("button", { name: "تشغيل الماسح" }).click();
  await page.getByLabel("أو اكتب الرمز").fill(badgeCode.toLowerCase());
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.locator(".result--good")).toContainText(name);
  await expect(page.locator(".desk-count .numeric")).toHaveText(String(countBefore + 1));

  // A badge left in view keeps reading: the success message must stay on screen.
  await page.waitForTimeout(3000);
  await page.getByLabel("أو اكتب الرمز").fill(badgeCode);
  await page.getByRole("button", { name: "تأكيد" }).click();
  await page.waitForTimeout(500);
  await expect(page.locator(".result--good")).toContainText(name);

  await page.reload();
  await page.getByRole("button", { name: "تشغيل الماسح" }).click();
  await page.getByLabel("أو اكتب الرمز").fill(badgeCode);
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.locator(".result--warn")).toContainText("مسجل حضوره مسبقًا");
  await page.getByLabel("أو اكتب الرمز").fill("FWNOTAREALCODE");
  await page.getByRole("button", { name: "تأكيد" }).click();
  await expect(page.locator(".result--bad")).toContainText("لا يوجد زائر");

  await visitor.reload();
  await expect(visitor.getByRole("status")).toContainText("سُجل حضورك");
  await visitorContext.close();
});

test("the registrant list searches, and the CSV opens with correct Arabic", async ({ page, request }) => {
  const name = `مسجل${Date.now()}`;
  const email = await registerByApi(request, name);
  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto("/ar/admin/registrants");
  await page.getByLabel("ابحث بالاسم").fill(email);
  await page.getByRole("button", { name: "بحث" }).click();
  await expect(page.locator(".registrants li")).toHaveCount(1);
  await expect(page.locator(".registrants")).toContainText(name);

  const csv = await page.evaluate(async () => {
    const buffer = await (await fetch("/api/admin/registrants/csv?locale=ar")).arrayBuffer();
    return { firstByte: new Uint8Array(buffer)[0], text: new TextDecoder().decode(buffer) };
  });
  expect(csv.firstByte).toBe(0xef);
  expect(csv.text).toContain("الاسم");
  expect(csv.text).toContain(name);
});

test("an admin promotes a visitor to staff, and access takes effect immediately", async ({ browser, page, baseURL }) => {
  const visitorContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const visitor = await visitorContext.newPage();
  const email = uniqueEmail();
  await visitor.goto("/ar/register");
  await registerByForm(visitor, "منظم جديد", email);
  await expect(visitor).toHaveURL(/\/ar\/badge$/);

  await page.goto("/ar/login");
  await loginByForm(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/ar$/);
  await page.goto(`/ar/admin/registrants?q=${encodeURIComponent(email)}`);
  await page.locator(".role-select select").selectOption("staff");
  await expect.poll(async () => {
    await visitor.goto("/ar/staff/check-in");
    return visitor.url();
  }).toMatch(/\/ar\/staff\/check-in$/);

  await page.locator(".role-select select").selectOption("visitor");
  await expect.poll(async () => {
    await visitor.goto("/ar/staff/check-in");
    return visitor.url();
  }).toMatch(/\/ar$/);
  await visitorContext.close();
});

test("a forgotten password can be reset by emailed link, once", async ({ page, request }) => {
  const email = await registerByApi(request);
  await page.goto("/ar/forgot-password");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByRole("button", { name: "أرسل الرابط" }).click();
  await expect(page.getByRole("status")).toContainText("إذا كان البريد مسجلًا");

  let body = "";
  await expect.poll(async () => {
    const list = await (await request.get(`${MAILPIT}/search?query=${encodeURIComponent(`to:"${email}"`)}`)).json();
    if (!list.messages?.length) return false;
    body = (await (await request.get(`${MAILPIT}/message/${list.messages[0].ID}`)).json()).Text;
    return true;
  }, { timeout: 15_000 }).toBe(true);

  const link = body.match(/https?:\/\/\S+/)?.[0] ?? "";
  await page.goto(link);
  await page.getByLabel("كلمة المرور الجديدة").fill("brand-new-password");
  await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();
  await expect(page.getByRole("status")).toContainText("تم تغيير كلمة المرور");

  await page.goto("/ar/login");
  await loginByForm(page, email, "brand-new-password");
  await expect(page).toHaveURL(/\/ar$/);
  await page.context().clearCookies();

  await page.goto(link);
  await page.getByLabel("كلمة المرور الجديدة").fill("another-password-1");
  await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();
  await expect(page.locator(".form-error")).toContainText("انتهت مدته");
});
