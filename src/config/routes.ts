// Every page and API path in the site, so no other file writes a route by hand.
import type { Locale } from "./locales";

export const PAGE_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  agenda: "/agenda",
  map: "/map",
  badge: "/badge",
  coins: "/coins",
  scan: (token: string) => `/scan/${encodeURIComponent(token)}`,
  staffCheckIn: "/staff/check-in",
  admin: "/admin",
  adminRegistrants: "/admin/registrants",
  adminAgenda: "/admin/agenda",
  adminZones: "/admin/zones",
  adminCoinCodes: "/admin/coin-codes",
  adminCoinCodePrint: (id: string) => `/admin/coin-codes/${id}/print`,
} as const;

export const API_ROUTES = {
  health: "/api/health",
  register: "/api/auth/register",
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",
  coinClaim: "/api/coins/claim",
  checkIn: "/api/staff/check-in",
  adminRegistrantsCsv: "/api/admin/registrants/csv",
  adminUserRole: (id: string) => `/api/admin/users/${id}/role`,
  adminZones: "/api/admin/zones",
  adminZone: (id: string) => `/api/admin/zones/${id}`,
  adminAgenda: "/api/admin/agenda",
  adminAgendaItem: (id: string) => `/api/admin/agenda/${id}`,
  adminCoinCodes: "/api/admin/coin-codes",
  adminCoinCode: (id: string) => `/api/admin/coin-codes/${id}`,
  adminCoinCodeQr: (id: string) => `/api/admin/coin-codes/${id}/qr`,
} as const;

// Files served from the public folder.
export const ASSET_PATHS = { ogImage: "/og.jpg", icon: "/icon.svg" } as const;
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

// Finds the code inside any scanned link to this site.
export const SCAN_LINK_PATTERN = /\/scan\/([^/?#]+)\/?(?:[?#].*)?$/;

/** Adds the language prefix to a page path. */
export function localePath(locale: Locale, path: string): string {
  return path === PAGE_ROUTES.home ? `/${locale}` : `/${locale}${path}`;
}

/** Swaps the language prefix of a current path, keeping the rest of it. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const rest = pathname.split("/").slice(2).join("/");
  return rest ? `/${locale}/${rest}` : `/${locale}`;
}
