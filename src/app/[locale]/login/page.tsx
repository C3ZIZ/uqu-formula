// The login screen. It returns the visitor to where they were headed.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { PageBand } from "@/components/PageBand";
import { QUERY_PARAMS } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { hasLiveSession } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { safeNextPath } from "@/lib/safe-redirect";

interface LoginProps extends LocaleProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Shows the login form, or moves on if the visitor is already logged in. */
export default async function LoginPage({ params, searchParams }: LoginProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const rawNext = (await searchParams)[QUERY_PARAMS.next];
  const next = safeNextPath(rawNext, localePath(locale, PAGE_ROUTES.home));
  if (await hasLiveSession()) redirect(next);
  const carry = rawNext ? `?${new URLSearchParams({ [QUERY_PARAMS.next]: next })}` : "";

  return (
    <main className="page">
      <PageBand title={text.auth.loginTitle} lead={text.auth.loginLead} />
      <div className="content section">
        <AuthForm mode="login" locale={locale} text={text} next={next} />
        <div className="auth-links">
          <Link className="text-action" href={`${localePath(locale, PAGE_ROUTES.register)}${carry}`}>
            {text.auth.toRegister}
          </Link>
          <Link className="text-action" href={localePath(locale, PAGE_ROUTES.forgotPassword)}>
            {text.auth.toForgot}
          </Link>
        </div>
      </div>
    </main>
  );
}
