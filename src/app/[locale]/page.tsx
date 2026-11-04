// The home screen: event identity, what it is, and the next step for this visitor.
import { CalendarDays, ChevronsRight, IdCard, QrCode, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { CoinCount } from "@/components/CoinCount";
import { Logo } from "@/components/Logo";
import { Slashes } from "@/components/Slashes";
import { EVENT } from "@/config/event";
import { ROLES } from "@/config/literals";
import type { Locale } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { formatEventDate } from "@/lib/dates";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getSession } from "@/lib/session";
import { getCoinSummary } from "@/services/coins";
import { getUserById } from "@/services/users";

/** Loads what the home screen shows a logged-in visitor. */
async function loadVisitor(locale: Locale) {
  const session = await getSession();
  if (!session) return null;
  const [user, summary] = await Promise.all([getUserById(session.userId), getCoinSummary(session.userId, locale)]);
  return user ? { name: user.name, role: user.role, total: summary.total } : null;
}

/** Shows the home screen. */
export default async function HomePage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const visitor = await loadVisitor(locale);
  /** Adds the language to a page path. */
  const path = (route: string) => localePath(locale, route);

  return (
    <main className="page">
      <section className="band hero">
        <Slashes />
        <div className="content hero-inner">
          <Logo size={64} />
          <p className="hero-kicker">{text.home.kicker}</p>
          <h1>{text.brand.name}</h1>
          <p className="hero-line">{text.home.headline}</p>
          {visitor ? (
            <>
              <p className="hero-greeting">
                {text.home.greeting} {visitor.name}
              </p>
              <dl className="hero-coins">
                <dt>{text.home.yourCoins}</dt>
                <dd>
                  <CoinCount value={visitor.total} />
                </dd>
              </dl>
              <div className="actions">
                <Link className="button button--accent" href={path(PAGE_ROUTES.badge)}>
                  <IdCard size={20} aria-hidden="true" />
                  {text.home.ctaBadge}
                </Link>
                <Link className="text-action" href={path(PAGE_ROUTES.agenda)}>
                  {text.home.ctaAgenda}
                </Link>
              </div>
            </>
          ) : (
            <div className="actions">
              <Link className="button button--accent" href={path(PAGE_ROUTES.register)}>
                {text.home.ctaRegister}
              </Link>
              <Link className="text-action" href={path(PAGE_ROUTES.login)}>
                {text.home.ctaLogin}
              </Link>
            </div>
          )}
        </div>
      </section>

      {visitor?.role === ROLES.admin ? (
        <div className="content admin-link">
          <Link className="text-action" href={path(PAGE_ROUTES.admin)}>
            <ShieldCheck size={18} aria-hidden="true" />
            {text.nav.admin}
          </Link>
        </div>
      ) : null}

      <section className="content section">
        <h2 className="section-title">{text.home.aboutTitle}</h2>
        <p>{text.home.about}</p>
        <p className="about-more">{text.home.aboutMore}</p>
      </section>

      <section className="content section">
        <h2 className="section-title">{text.home.stepsTitle}</h2>
        <ol className="steps">
          <li>
            <UserPlus size={24} aria-hidden="true" />
            <span>{text.home.stepRegister}</span>
          </li>
          <li>
            <IdCard size={24} aria-hidden="true" />
            <span>{text.home.stepAttend}</span>
          </li>
          <li>
            <QrCode size={24} aria-hidden="true" />
            <span>{text.home.stepCollect}</span>
          </li>
        </ol>
      </section>

      <section className="content section">
        <ul className="day-strip">
          {EVENT.days.map((day) => (
            <li key={day.number}>
              <CalendarDays size={18} aria-hidden="true" />
              <span>{text.agenda.day} <b className="numeric">{day.number}</b></span>
              <span className="lead">{formatEventDate(day.date, locale)}</span>
              <ChevronsRight className="day-chevrons" size={18} aria-hidden="true" />
            </li>
          ))}
        </ul>
        <p className="organizer">{text.brand.organizer}</p>
      </section>
    </main>
  );
}
