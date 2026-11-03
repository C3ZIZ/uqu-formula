// Reads and writes the login cookie.
import { cookies } from "next/headers";
import { LIMITS } from "@/config/limits";
import { COOKIES } from "@/config/literals";
import { getEnv } from "./env";
import { signSession, verifySession, type Session } from "./session-token";

/** Returns the current visitor's session without touching the database. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIES.session)?.value;
  return token ? verifySession(token) : null;
}

/** Logs a visitor in by setting a protected cookie. */
export async function setSessionCookie(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIES.session, await signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE === "true",
    path: "/",
    maxAge: LIMITS.sessionDays * 24 * 60 * 60,
  });
}

/** Logs a visitor out by removing the cookie. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIES.session);
}
