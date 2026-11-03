// The coins screen: total, scanner, and history.
import { CoinCount } from "@/components/CoinCount";
import { ScanButton } from "@/components/ScanButton";
import { Slashes } from "@/components/Slashes";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getCoinSummary } from "@/services/coins";

/** Shows the visitor's coins and how to earn more. */
export default async function CoinsPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const session = await requireSession(locale, localePath(locale, PAGE_ROUTES.coins));
  const summary = await getCoinSummary(session.userId, locale);

  return (
    <main className="page">
      <div className="band coins-band">
        <Slashes />
        <div className="content coins-inner">
          <h1 className="coins-label">{text.coins.total}</h1>
          <p className="coins-total">
            <CoinCount value={summary.total} />
            <span className="coins-unit">{text.coins.unit}</span>
          </p>
          <ScanButton locale={locale} expected="coin" scanLabel={text.coins.scan} text={text.scanner} />
        </div>
      </div>

      <section className="content section">
        <h2 className="section-title">{text.coins.historyTitle}</h2>
        {summary.claims.length === 0 ? <p className="lead">{text.coins.empty}</p> : null}
        <ul className="rows">
          {summary.claims.map((claim) => (
            <li key={claim.claimedAt.toISOString()} className="row-main">
              <span>
                <b>{claim.label}</b>
                <span className="row-sub lead">{formatDateTime(claim.claimedAt, locale)}</span>
              </span>
              <b className="numeric coin-gain">+{claim.coins}</b>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
