// Signs and verifies the session token stored in the login cookie.
import { jwtVerify, SignJWT } from "jose";
import { LIMITS } from "@/config/limits";
import { JWT_ALGORITHM, ROLE_LIST, type Role } from "@/config/literals";
import { getEnv } from "./env";

export interface Session {
  userId: string;
  name: string;
  role: Role;
}

/** Returns the signing key as bytes. */
function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

/** Creates a signed token for a logged-in user. */
export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ name: session.name, role: session.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${LIMITS.sessionDays}d`)
    .sign(secretKey());
}

/** Reads a token and returns its session, or null if it is forged, expired, or broken. */
export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [JWT_ALGORITHM] });
    const role = payload.role as Role;
    if (!payload.sub || typeof payload.name !== "string" || !ROLE_LIST.includes(role)) return null;
    return { userId: payload.sub, name: payload.name, role };
  } catch {
    return null;
  }
}
