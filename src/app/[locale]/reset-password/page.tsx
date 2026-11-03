// The screen opened from the password reset email.
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PageBand } from "@/components/PageBand";
import { QUERY_PARAMS } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { pageLocale, type LocaleProps } from "@/lib/page";

interface ResetProps extends LocaleProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Shows the new-password form. */
export default async function ResetPasswordPage({ params, searchParams }: ResetProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const token = (await searchParams)[QUERY_PARAMS.token] ?? "";
  return (
    <main className="page">
      <PageBand title={text.auth.resetTitle} lead={text.auth.resetLead} />
      <div className="content section">
        <AuthForm mode="reset" locale={locale} text={text} token={token} />
        <div className="auth-links">
          <Link className="text-action" href={localePath(locale, PAGE_ROUTES.login)}>
            {text.auth.toLogin}
          </Link>
        </div>
      </div>
    </main>
  );
}
