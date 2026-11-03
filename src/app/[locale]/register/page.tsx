// The registration screen.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { PageBand } from "@/components/PageBand";
import { QUERY_PARAMS } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";

interface RegisterProps extends LocaleProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Shows the registration form, or moves on if the visitor is already logged in. */
export default async function RegisterPage({ params, searchParams }: RegisterProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const rawNext = (await searchParams)[QUERY_PARAMS.next];
  const next = safeNextPath(rawNext, localePath(locale, PAGE_ROUTES.badge));
  if (await getSession()) redirect(next);
  const carry = rawNext ? `?${new URLSearchParams({ [QUERY_PARAMS.next]: next })}` : "";

  return (
    <main className="page">
      <PageBand title={text.auth.registerTitle} lead={text.auth.registerLead} />
      <div className="content section">
        <AuthForm mode="register" locale={locale} text={text} next={next} />
        <div className="auth-links">
          <Link className="text-action" href={`${localePath(locale, PAGE_ROUTES.login)}${carry}`}>
            {text.auth.toLogin}
          </Link>
        </div>
      </div>
    </main>
  );
}
