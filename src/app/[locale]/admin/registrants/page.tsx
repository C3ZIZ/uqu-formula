// The registrant list with search, attendance, roles, and CSV export.
import { Download } from "lucide-react";
import Link from "next/link";
import { PageBand } from "@/components/PageBand";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { LIMITS } from "@/config/limits";
import { QUERY_PARAMS } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { listRegistrants } from "@/services/users";

interface RegistrantsProps extends LocaleProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Shows one page of registrants. */
export default async function RegistrantsPage({ params, searchParams }: RegistrantsProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const copy = text.admin.registrants;
  const query = await searchParams;
  const search = query[QUERY_PARAMS.search] ?? "";
  const page = Math.max(Number(query[QUERY_PARAMS.page]) || 1, 1);
  const { rows, total } = await listRegistrants({ search, page });
  const lastPage = Math.max(Math.ceil(total / LIMITS.registrantsPageSize), 1);
  const base = localePath(locale, PAGE_ROUTES.adminRegistrants);

  /** Builds the address of another results page, keeping the search. */
  const pageHref = (target: number) =>
    `${base}?${new URLSearchParams({ [QUERY_PARAMS.search]: search, [QUERY_PARAMS.page]: String(target) })}`;
  const csvHref = `${API_ROUTES.adminRegistrantsCsv}?${new URLSearchParams({ [QUERY_PARAMS.locale]: locale })}`;

  return (
    <main className="page">
      <PageBand title={text.admin.sections.registrants} lead={`${copy.total}: ${total}`}>
        <div className="actions band-actions">
          <a className="button button--accent" href={csvHref} download>
            <Download size={20} aria-hidden="true" />
            {copy.export}
          </a>
        </div>
      </PageBand>
      <div className="content">
        <form className="search" action={base}>
          <div className="field">
            <label htmlFor="registrant-search">{copy.search}</label>
            <input id="registrant-search" name={QUERY_PARAMS.search} type="search" defaultValue={search} />
          </div>
          <button className="button" type="submit">{copy.searchSubmit}</button>
        </form>

        {rows.length === 0 ? <p className="lead section">{copy.empty}</p> : null}
        <ul className="rows registrants">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="row-main">
                <b dir="auto">{row.name}</b>
                <span className="numeric coin-gain">{row.coins}</span>
              </div>
              <p className="lead registrant-contact" dir="ltr">{row.email} · {row.phone}</p>
              <div className="row-main registrant-foot">
                <span>{copy.attendance}: <b className="numeric">{row.attendanceDays}</b></span>
                <RoleSelect
                  userId={row.id}
                  role={row.role}
                  label={copy.role}
                  roles={copy.roles}
                  errors={text.errors}
                />
              </div>
            </li>
          ))}
        </ul>

        {lastPage > 1 ? (
          <div className="pager">
            {page > 1 ? <Link className="text-action" href={pageHref(page - 1)}>{copy.previous}</Link> : <span />}
            <span className="numeric">{page} / {lastPage}</span>
            {page < lastPage ? <Link className="text-action" href={pageHref(page + 1)}>{copy.next}</Link> : <span />}
          </div>
        ) : null}
      </div>
    </main>
  );
}
