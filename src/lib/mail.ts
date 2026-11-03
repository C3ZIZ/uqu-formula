// Sends the password reset email.
import nodemailer from "nodemailer";
import type { Locale } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { getEnv } from "./env";

/** Connects to the configured mail server. */
function createTransport() {
  const env = getEnv();
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
}

/** Emails a password reset link in the visitor's language. */
export async function sendPasswordResetEmail(to: string, link: string, locale: Locale): Promise<void> {
  const text = getMessages(locale).email;
  await createTransport().sendMail({
    from: getEnv().MAIL_FROM,
    to,
    subject: text.resetSubject,
    text: `${text.resetBody}\n\n${link}\n\n${text.resetIgnore}`,
  });
}
