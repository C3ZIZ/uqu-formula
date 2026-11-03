// Downloads all registrants as a CSV file.
import { CONTENT_TYPES, CSV_FILE_NAME, QUERY_PARAMS } from "@/config/literals";
import { DEFAULT_LOCALE, isLocale } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { listAllRegistrants } from "@/services/users";

// Builds the file with headers in the admin's language.
export const GET = route(async (request: Request) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const requested = new URL(request.url).searchParams.get(QUERY_PARAMS.locale) ?? "";
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  const { csvHeaders, roles } = getMessages(locale).admin.registrants;
  const registrants = await listAllRegistrants();
  const rows = registrants.map((row) => [
    row.name,
    row.email,
    row.phone,
    roles[row.role],
    row.createdAt.toISOString(),
    row.attendanceDays,
    row.coins,
  ]);
  const header = [
    csvHeaders.name,
    csvHeaders.email,
    csvHeaders.phone,
    csvHeaders.role,
    csvHeaders.registeredAt,
    csvHeaders.attendance,
    csvHeaders.coins,
  ];
  return new Response(toCsv([header, ...rows]), {
    headers: {
      "Content-Type": CONTENT_TYPES.csv,
      "Content-Disposition": `attachment; filename="${CSV_FILE_NAME}"`,
      "Cache-Control": "no-store",
    },
  });
});
