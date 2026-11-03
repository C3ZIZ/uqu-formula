// The screen that requests a password reset email.
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { PageBand } from "@/components/PageBand";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { pageLocale, type LocaleProps } from "@/lib/page";

/** Shows the forgot-password form. */
export default async function ForgotPasswordPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  return (
    <main className="page">
      <PageBand title={text.auth.forgotTitle} lead={text.auth.forgotLead} />
      <div className="content section">
        <AuthForm mode="forgot" locale={locale} text={text} />
        <div className="auth-links">
          <Link className="text-action" href={localePath(locale, PAGE_ROUTES.login)}>
            {text.auth.toLogin}
          </Link>
        </div>
      </div>
    </main>
  );
}
