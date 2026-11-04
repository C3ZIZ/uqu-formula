// The coins screen: total, badges, and history.
import { BadgeMedal } from "@/components/BadgeMedal";
import { CoinCount } from "@/components/CoinCount";
import { Slashes } from "@/components/Slashes";
import { BADGE_KINDS_BY_NAME } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { pickLocalized } from "@/lib/localized";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getVisitorBadges } from "@/services/badges";
import { getCoinSummary } from "@/services/coins";

/** Shows the visitor's coins, their badges, and how to earn more. */
export default async function CoinsPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const user = await requireUser(locale, localePath(locale, PAGE_ROUTES.coins));
  const [summary, badges] = await Promise.all([getCoinSummary(user.id, locale), getVisitorBadges(user.id)]);

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
        </div>
      </div>

      {badges.length > 0 ? (
        <section className="content section">
          <h2 className="section-title">{text.coins.badgesTitle}</h2>
          <ul className="rows">
            {badges.map((badge) => (
              <li key={badge.id} className="visitor-badge">
                <BadgeMedal id={badge.id} icon={badge.icon} imageUpdatedAt={badge.imageUpdatedAt} earned={badge.earned} />
                <span>
                  <b>{pickLocalized(locale, badge.nameAr, badge.nameEn)}</b>
                  <span className="row-sub lead">
                    {badge.earned ? (
                      <>
                        {text.coins.badgeEarned}
                        {badge.earnedAt ? ` · ${formatDateTime(badge.earnedAt, locale)}` : ""}
                      </>
                    ) : (
                      <>
                        {pickLocalized(locale, badge.challengeAr, badge.challengeEn)}
                        {badge.kind === BADGE_KINDS_BY_NAME.allDays ? (
                          <>
                            {" · "}
                            {text.coins.attended} <span className="numeric">{badge.attended}</span> {text.coins.attendedOf}{" "}
                            <span className="numeric">{badge.totalDays}</span> {text.coins.attendedDays}
                          </>
                        ) : null}
                      </>
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
