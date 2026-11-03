// Numeric limits and tuning values for security, caching, and the database.
export const LIMITS = {
  passwordMinLength: 8,
  passwordMaxLength: 128,
  nameMaxLength: 100,
  emailMaxLength: 254,
  textMaxLength: 1000,
  labelMaxLength: 120,
  loginMaxFailures: 5,
  lockMinutes: 5,
  sessionDays: 14,
  resetTokenMinutes: 60,
  resetTokenBytes: 32,
  contentCacheMs: 10_000,
  hashConcurrency: 2,
  dbPoolMax: 20,
  dbIdleMs: 30_000,
  dbConnectMs: 5_000,
  registrantsPageSize: 50,
  coinCodeLength: 12,
  badgeCodeLength: 10,
  coinsMin: 1,
  coinsMax: 10_000,
  scanIntervalMs: 150,
  scanCooldownMs: 2_500,
  coinCountUpMs: 700,
} as const;

// Password hashing cost: an OWASP-recommended scrypt setting.
export const SCRYPT = { N: 32768, r: 8, p: 3, keyLength: 32, saltLength: 16, maxmem: 256 * 1024 * 1024 } as const;
