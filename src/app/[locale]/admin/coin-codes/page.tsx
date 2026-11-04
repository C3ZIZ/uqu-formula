// The admin coin codes page.
import { PageBand } from "@/components/PageBand";
import { CoinCodesManager } from "@/components/admin/CoinCodesManager";
import { getMessages } from "@/config/messages";
import { requireAdmin } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { listCoinCodes } from "@/services/coins";

/** Lists all coin codes and how often each was collected. */
export default async function AdminCoinCodesPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  await requireAdmin(locale);
  const text = getMessages(locale);
  return (
    <main className="page">
      <PageBand title={text.admin.sections.coinCodes} lead={text.admin.coinCodes.lead} />
      <CoinCodesManager
        locale={locale}
        items={await listCoinCodes()}
        unit={text.coins.unit}
        text={text.admin}
        errors={text.errors}
        fieldErrors={text.fieldErrors}
      />
    </main>
  );
}
