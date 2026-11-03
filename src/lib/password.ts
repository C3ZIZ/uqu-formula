// Hashes and checks passwords with scrypt from Node's standard library.
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { LIMITS, SCRYPT } from "@/config/limits";
import { createLimiter } from "./limiter";

const FORMAT = "scrypt";

// A rush of logins waits in line here, so pages stay fast for everyone else.
const hashSlot = createLimiter(LIMITS.hashConcurrency);

/** Runs scrypt in the background thread pool so it never blocks other requests. */
function derive(password: string, salt: Buffer, N: number, r: number, p: number, length: number): Promise<Buffer> {
  return hashSlot(
    () =>
      new Promise((resolve, reject) => {
        scrypt(password, salt, length, { N, r, p, maxmem: SCRYPT.maxmem }, (error, key) => {
          if (error) reject(error);
          else resolve(key);
        });
      }),
  );
}

/** Turns a password into a salted hash that stores its own settings. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT.saltLength);
  const key = await derive(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLength);
  return [FORMAT, SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

/** Checks a password against a stored hash. A malformed hash simply fails. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [format, N, r, p, salt, key] = stored.split("$");
  if (format !== FORMAT || !salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await derive(password, Buffer.from(salt, "base64url"), Number(N), Number(r), Number(p), expected.length);
  return timingSafeEqual(actual, expected);
}
