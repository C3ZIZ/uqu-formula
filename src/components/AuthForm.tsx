// The login, registration, forgot-password, and reset-password forms.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { CircleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field } from "./Field";

type Mode = "login" | "register" | "forgot" | "reset";

interface AuthFormProps {
  mode: Mode;
  locale: Locale;
  text: Pick<Messages, "auth" | "errors" | "fieldErrors">;
  next?: string;
  token?: string;
}

const ENDPOINTS: Record<Mode, string> = {
  login: API_ROUTES.login,
  register: API_ROUTES.register,
  forgot: API_ROUTES.forgotPassword,
  reset: API_ROUTES.resetPassword,
};

/** Renders the fields for one mode and submits them to the API. */
export function AuthForm({ mode, locale, text, next, token }: AuthFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [badFields, setBadFields] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  /** Submits the form and shows the result in place. */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    setBadFields([]);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await sendJson(ENDPOINTS[mode], "POST", { ...values, locale, token });
    if (result.ok) {
      if (mode === "login" || mode === "register") {
        window.location.assign(next ?? localePath(locale, PAGE_ROUTES.home));
        return;
      }
      setDone(true);
    } else {
      setError((text.errors as Record<string, string>)[result.error] ?? text.errors.SERVER);
      setBadFields(result.fields);
    }
    setBusy(false);
  }

  /** Returns the error text for a field the server rejected. */
  function fieldError(name: keyof Messages["fieldErrors"]): string | undefined {
    return badFields.includes(name) ? text.fieldErrors[name] : undefined;
  }

  if (done) {
    const message = mode === "forgot" ? text.auth.forgotDone : text.auth.resetDone;
    return <p className="form-note" role="status">{message}</p>;
  }

  const submitLabels: Record<Mode, string> = {
    login: text.auth.submitLogin,
    register: text.auth.submitRegister,
    forgot: text.auth.submitForgot,
    reset: text.auth.submitReset,
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      {mode === "register" ? (
        <Field name="name" label={text.auth.name} autoComplete="name" required error={fieldError("name")} />
      ) : null}
      {mode !== "reset" ? (
        <Field
          name="email"
          label={text.auth.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          latin
          error={fieldError("email")}
        />
      ) : null}
      {mode === "register" ? (
        <Field
          name="phone"
          label={text.auth.phone}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          latin
          error={fieldError("phone")}
        />
      ) : null}
      {mode !== "forgot" ? (
        <Field
          name="password"
          label={mode === "reset" ? text.auth.newPassword : text.auth.password}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          latin
          showLabel={text.auth.showPassword}
          hideLabel={text.auth.hidePassword}
          error={fieldError("password")}
        />
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <button className="button button--block" type="submit" disabled={busy}>
        {busy ? text.auth.working : submitLabels[mode]}
      </button>
    </form>
  );
}
