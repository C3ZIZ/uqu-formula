// Access checks for pages and API routes. Admin checks always re-read the role from the database.
import { redirect } from "next/navigation";
import { ERROR_CODES, QUERY_PARAMS, ROLES, type Role } from "@/config/literals";
import type { Locale } from "@/config/locales";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { getUserById, type User } from "@/services/users";
import { jsonError } from "./api";
import { getSession } from "./session";
import type { Session } from "./session-token";

export const ADMIN_ROLES: Role[] = [ROLES.admin];

/** Builds the login address that returns the visitor to where they were. */
export function loginPathWithNext(locale: Locale, nextPath: string): string {
  const params = new URLSearchParams({ [QUERY_PARAMS.next]: nextPath });
  return `${localePath(locale, PAGE_ROUTES.login)}?${params}`;
}

/** Returns the logged-in visitor for a page, or sends them to login. */
export async function requireSession(locale: Locale, nextPath: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPathWithNext(locale, nextPath));
  return session;
}

/** Returns the database user for a page, or sends them to login. */
export async function requireUser(locale: Locale, nextPath: string): Promise<User> {
  const session = await requireSession(locale, nextPath);
  const user = await getUserById(session.userId);
  if (!user) redirect(loginPathWithNext(locale, nextPath));
  return user;
}

/** Returns the user for an admin page, or sends them home without the role. */
export async function requireRole(locale: Locale, nextPath: string, roles: Role[]): Promise<User> {
  const user = await requireUser(locale, nextPath);
  if (!roles.includes(user.role)) redirect(localePath(locale, PAGE_ROUTES.home));
  return user;
}

type ApiAccess<T> = { ok: true; value: T } | { ok: false; response: Response };

/** Returns the session for an API route, or a ready error reply. */
export async function apiSession(): Promise<ApiAccess<Session>> {
  const session = await getSession();
  return session ? { ok: true, value: session } : { ok: false, response: jsonError(ERROR_CODES.unauthorized) };
}

/** Returns the database user for an admin API route, or a ready error reply. */
export async function apiRole(roles: Role[]): Promise<ApiAccess<User>> {
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError(ERROR_CODES.unauthorized) };
  const user = await getUserById(session.userId);
  if (!user) return { ok: false, response: jsonError(ERROR_CODES.unauthorized) };
  if (!roles.includes(user.role)) return { ok: false, response: jsonError(ERROR_CODES.forbidden) };
  return { ok: true, value: user };
}
