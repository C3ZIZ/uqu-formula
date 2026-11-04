// The admin page for daily attendance codes.
import { PageBand } from "@/components/PageBand";
import { AttendanceCodesManager } from "@/components/admin/AttendanceCodesManager";
import { getMessages } from "@/config/messages";
import { riyadhDate } from "@/lib/dates";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { listAttendanceCodes } from "@/services/attendance-codes";
import { loadZones } from "@/services/zones";

/** Lists the daily codes, their places, and how many visitors attended each day. */
export default async function AdminAttendanceCodesPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const [items, zones] = await Promise.all([listAttendanceCodes(), loadZones()]);
  return (
    <main className="page">
      <PageBand title={text.admin.sections.attendanceCodes} lead={text.admin.attendanceCodes.lead} />
      <AttendanceCodesManager
        locale={locale}
        items={items}
        zones={zones.map(({ id, nameAr, nameEn, type }) => ({ id, nameAr, nameEn, type }))}
        today={riyadhDate()}
        text={text.admin}
        errors={text.errors}
        fieldErrors={text.fieldErrors}
      />
    </main>
  );
}
