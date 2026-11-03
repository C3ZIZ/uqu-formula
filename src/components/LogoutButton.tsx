// Logs the visitor out.
"use client";

import type { Locale } from "@/config/locales";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";

/** Ends the session and returns to the home screen. */
export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  /** Calls the logout route, then reloads at home. */
  async function logout() {
    await sendJson(API_ROUTES.logout, "POST");
    window.location.assign(localePath(locale, PAGE_ROUTES.home));
  }

  return (
    <button type="button" className="text-action" onClick={logout}>
      {label}
    </button>
  );
}
