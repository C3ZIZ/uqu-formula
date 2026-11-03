// Fixed values shared across the app: roles, error codes, cookie names, and zone types.
export const ROLES = { visitor: "visitor", staff: "staff", admin: "admin" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ROLE_LIST = [ROLES.visitor, ROLES.staff, ROLES.admin] as const;

export const ERROR_CODES = {
  validation: "VALIDATION",
  emailTaken: "EMAIL_TAKEN",
  invalidCredentials: "INVALID_CREDENTIALS",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  badOrigin: "BAD_ORIGIN",
  notFound: "NOT_FOUND",
  lastAdmin: "LAST_ADMIN",
  codeHasClaims: "CODE_HAS_CLAIMS",
  resetInvalid: "RESET_INVALID",
  server: "SERVER",
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const COOKIES = { session: "fw_session", locale: "fw_locale" } as const;

export const ZONE_TYPES = ["stage", "workshop", "booth", "competition", "services", "entrance"] as const;
export type ZoneType = (typeof ZONE_TYPES)[number];

export const QUERY_PARAMS = { next: "next", token: "token", search: "q", page: "page", locale: "locale", zone: "zone" } as const;

export const CLAIM_STATUS = { claimed: "claimed", already: "already", invalid: "invalid" } as const;
export type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS];

export const CHECK_IN_STATUS = { checkedIn: "checked_in", already: "already", unknown: "unknown" } as const;
export type CheckInStatus = (typeof CHECK_IN_STATUS)[keyof typeof CHECK_IN_STATUS];

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const BADGE_CODE_PREFIX = "FW";

export const CSV_FILE_NAME = "formula-week-registrants.csv";
export const JWT_ALGORITHM = "HS256";
export const CONTENT_TYPES = { csv: "text/csv; charset=utf-8", svg: "image/svg+xml" } as const;
export const HEADERS = { origin: "origin", host: "host", forwardedHost: "x-forwarded-host" } as const;
export const QR_OPTIONS = { margin: 2, errorCorrectionLevel: "M", darkColor: "#0c272c", lightColor: "#ffffff" } as const;
