// Tests at the HTTP level that no admin page sends its data to anyone but an admin. Browsers follow redirects, so they cannot see this.
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createCode, createPlace, loginAdminApi, registerByApi } from "./helpers";

const RSC_HEADERS = { RSC: "1" };

/** Reads every way a client can ask for a page, and joins the bodies together. */
async function readAllForms(request: APIRequestContext, page: string): Promise<string> {
  const replies = await Promise.all([
    request.get(page, { maxRedirects: 0 }),
    request.get(page),
    request.get(page, { maxRedirects: 0, headers: RSC_HEADERS }),
    request.get(page, { headers: RSC_HEADERS }),
  ]);
  return (await Promise.all(replies.map((reply) => reply.text()))).join("\n");
}

test("admin pages send their data only to admins", async ({ playwright, baseURL }) => {
  const admin = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const coin = await createCode(admin);
  await loginAdminApi(admin);
  const badgeReply = await admin.post("/api/admin/badges", {
    data: { kind: "challenge", nameAr: "سري", nameEn: "Secret", challengeAr: "تحدي", challengeEn: "Challenge", icon: "flag", isActive: true },
  });
  expect(badgeReply.status()).toBe(201);
  const badge = await badgeReply.json();
  const eventDate = `2033-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`;
  const attendanceReply = await admin.post("/api/admin/attendance-codes", {
    data: { eventDate, zoneId: await createPlace(admin) },
  });
  expect(attendanceReply.status()).toBe(201);
  const attendance = await attendanceReply.json();
  const visitor = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const visitorEmail = await registerByApi(visitor, "زائر الخصوصية");

  const secrets = [coin.token, badge.token, attendance.token, visitorEmail];
  const pages = [
    "/ar/admin",
    `/ar/admin/registrants?q=${encodeURIComponent(visitorEmail)}`,
    "/ar/admin/agenda",
    "/ar/admin/zones",
    "/ar/admin/coin-codes",
    `/ar/admin/coin-codes/${coin.id}/print`,
    "/ar/admin/attendance-codes",
    `/ar/admin/attendance-codes/${attendance.id}/print`,
    "/ar/admin/badges",
    `/ar/admin/badges/${badge.id}/print`,
  ];

  const anonymous = await playwright.request.newContext({ baseURL, ignoreHTTPSErrors: true });

  for (const page of pages) {
    for (const client of [anonymous, visitor]) {
      const body = await readAllForms(client, page);
      for (const secret of secrets) expect(body.includes(secret), `${page} exposes data`).toBe(false);
    }
  }

  // Confirms this test can see the data at all: the admin receives it the same way.
  expect(await readAllForms(admin, "/ar/admin/coin-codes")).toContain(coin.token);
  expect(await readAllForms(admin, `/ar/admin/registrants?q=${encodeURIComponent(visitorEmail)}`)).toContain(visitorEmail);

  await admin.delete(`/api/admin/badges/${badge.id}`);
  await Promise.all([admin.dispose(), anonymous.dispose(), visitor.dispose()]);
});
