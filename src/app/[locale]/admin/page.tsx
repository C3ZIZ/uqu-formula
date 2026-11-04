// The admin overview: registered people versus people who actually attended.
import { PageBand } from "@/components/PageBand";
import { getMessages } from "@/config/messages";
import { requireAdmin } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getOverviewCounts } from "@/services/users";

/** Shows the headline totals. */
export default async function AdminOverviewPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  await requireAdmin(locale);
  const text = getMessages(locale).admin;
  const counts = await getOverviewCounts();
  const rows = [
    { label: text.overview.registered, value: counts.registered },
    { label: text.overview.attendedToday, value: counts.attendedToday },
    { label: text.overview.attendedEver, value: counts.attendedEver },
    { label: text.overview.coinsIssued, value: counts.coinsIssued },
    { label: text.overview.claims, value: counts.claims },
  ];
  return (
    <main className="page">
      <PageBand title={text.title} />
      <dl className="content stats">
        {rows.map((row) => (
          <div key={row.label} className="stat">
            <dt>{row.label}</dt>
            <dd className="numeric">{row.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
