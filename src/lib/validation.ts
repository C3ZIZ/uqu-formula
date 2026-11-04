// Input rules for every form and API request.
import { z } from "zod";
import { DAY_NUMBERS, MAP_GRID } from "@/config/event";
import { LIMITS } from "@/config/limits";
import { ROLE_LIST, ZONE_TYPES } from "@/config/literals";
import { LOCALES } from "@/config/locales";
import { toLatinDigits } from "./digits";

export { toLatinDigits };

const emailField = z.string().trim().toLowerCase().max(LIMITS.emailMaxLength).pipe(z.email());
const passwordField = z.string().min(LIMITS.passwordMinLength).max(LIMITS.passwordMaxLength);
const phoneField = z
  .string()
  .transform((value) => toLatinDigits(value).replace(/[\s()-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{8,15}$/));
const shortText = z.string().trim().min(1).max(LIMITS.labelMaxLength);
const longText = z.string().trim().max(LIMITS.textMaxLength).default("");
const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(LIMITS.nameMaxLength),
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(LIMITS.passwordMaxLength),
});

export const forgotPasswordSchema = z.object({ email: emailField, locale: z.enum(LOCALES) });

export const resetPasswordSchema = z.object({ token: z.string().min(1), password: passwordField });

export const claimSchema = z.object({ token: z.string().trim().min(1).max(64) });

export const roleSchema = z.object({ role: z.enum(ROLE_LIST) });

export const coinCodeSchema = z.object({
  labelAr: shortText,
  labelEn: shortText,
  coins: z.coerce.number().int().min(LIMITS.coinsMin).max(LIMITS.coinsMax),
  isActive: z.boolean().default(true),
});

export const attendanceCodeSchema = z.object({ eventDate: z.iso.date() });

export const attendanceCodeUpdateSchema = z.object({ isActive: z.boolean() });

export const agendaSchema = z
  .object({
    titleAr: shortText,
    titleEn: shortText,
    detailsAr: longText,
    detailsEn: longText,
    day: z.coerce.number().refine((day) => (DAY_NUMBERS as number[]).includes(day)),
    startTime: timeField,
    endTime: timeField,
    zoneId: z.preprocess((value) => (value === "" ? null : value), z.uuid().nullable()),
  })
  .refine((item) => item.endTime > item.startTime, { path: ["endTime"] });

export const zoneSchema = z
  .object({
    nameAr: shortText,
    nameEn: shortText,
    detailsAr: longText,
    detailsEn: longText,
    type: z.enum(ZONE_TYPES),
    x: z.coerce.number().min(0).max(MAP_GRID.width),
    y: z.coerce.number().min(0).max(MAP_GRID.height),
    width: z.coerce.number().positive().max(MAP_GRID.width),
    height: z.coerce.number().positive().max(MAP_GRID.height),
  })
  .refine((zone) => zone.x + zone.width <= MAP_GRID.width, { path: ["width"] })
  .refine((zone) => zone.y + zone.height <= MAP_GRID.height, { path: ["height"] });

export type RegisterInput = z.infer<typeof registerSchema>;
export type CoinCodeInput = z.infer<typeof coinCodeSchema>;
export type AttendanceCodeInput = z.infer<typeof attendanceCodeSchema>;
export type AgendaInput = z.infer<typeof agendaSchema>;
export type ZoneInput = z.infer<typeof zoneSchema>;
