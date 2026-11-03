// Reads and checks environment settings once, on first use.
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().url().default("https://localhost"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("true"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default("Formula Week <no-reply@formulaweek.local>"),
});

let cached: z.infer<typeof envSchema> | undefined;

/** Returns the checked environment settings, failing clearly if one is missing. */
export function getEnv() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
