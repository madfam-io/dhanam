/**
 * Business-logic constants — named values replacing magic numbers.
 * Grouped by domain. All values are compile-time constants.
 */

// ── Time Units (seconds) ─────────────────────────────────────────────────────

export const TIME_UNITS = {
  MINUTE_SECONDS: 60,
  HOUR_SECONDS: 3_600,
  DAY_SECONDS: 86_400,
} as const;

// ── Anomaly Detection ────────────────────────────────────────────────────────

export const ANOMALY_DETECTION = {
  ZSCORE_THRESHOLD: 2.5,
  SPENDING_SPIKE_MULTIPLIER: 1.5,
  LARGE_TRANSACTION_USD: 500,
  MIN_HISTORY_DAYS: 30,
  DUPLICATE_WINDOW_HOURS: 48,
  MIN_DATA_POINTS: 3,
  AMOUNT_MULTIPLIER: 100,
  SEASONAL_LOOKBACK_PERIODS: 2,
  HIGH_FREQUENCY_THRESHOLD: 4,
  MINIMUM_CATEGORY_COUNT: 3,
} as const;

// ── Storage Limits ───────────────────────────────────────────────────────────

export const STORAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_SPACE_STORAGE_BYTES: 500 * 1024 * 1024,
  CSV_PREVIEW_THRESHOLD_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_MB: 50,
} as const;

// ── ML Thresholds ────────────────────────────────────────────────────────────

export const ML_THRESHOLDS = {
  FUZZY_MATCH_SCORE: 0.7,
  CATEGORIZATION_CONFIDENCE: 0.5,
  RECENCY_DAYS: 90,
  WEIGHT_DECAY_FACTOR: 0.5,
  MIN_CORRECTIONS_FOR_LEARNING: 10,
  MIN_CATEGORIZATION_CONFIDENCE: 0.5,
  MAX_MERCHANT_VARIANTS: 5,
} as const;

// ── Goal & Projection Thresholds ─────────────────────────────────────────────

export const GOAL_THRESHOLDS = {
  SUCCESS_PROBABILITY: 0.75,
  LOW_PROBABILITY: 0.35,
  RETENTION_DAYS: 90,
  WEEKLY_RATE_DIVISOR: 0.263,
  MIN_PROJECTION_YEARS: 5,
  MAX_PROJECTION_YEARS: 50,
  MIN_AGE: 18,
  MAX_AGE: 100,
  DEFAULT_INTEREST_RATE: 0.05,
} as const;

// ── ESG Thresholds ───────────────────────────────────────────────────────────

export const ESG_THRESHOLDS = {
  MODERATE_SCORE: 50,
  GOOD_ENVIRONMENTAL: 80,
  GOOD_GOVERNANCE: 80,
} as const;

// ── ESG Cache ────────────────────────────────────────────────────────────────

export const ESG_CACHE = {
  TTL_SECONDS: 3_600,
  MAX_ENTRIES: 500,
  SYMBOL_SLICE_LENGTH: 4,
} as const;

// ── Provider Health ──────────────────────────────────────────────────────────

export const PROVIDER_HEALTH = {
  DEGRADED_HOURS: 48,
  WARNING_HOURS: 24,
  RECENT_CONNECTION_DAYS: 30,
} as const;

// ── Analytics ────────────────────────────────────────────────────────────────

export const ANALYTICS = {
  HISTORY_DAYS: 90,
  PDF_PAGE_BREAK_Y: 700,
  SHARE_TOKEN_MAX_HOURS: 720,
  AMOUNT_DISPLAY_MULTIPLIER: 10_000,
} as const;

// ── Search ───────────────────────────────────────────────────────────────────

export const SEARCH_DEFAULTS = {
  MAX_RESULTS: 20,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_PERIOD_DAYS: 90,
} as const;

// ── Estate Planning ──────────────────────────────────────────────────────────

export const ESTATE_PLANNING = {
  EXECUTOR_ACCESS_EXPIRY_DAYS: 30,
} as const;

// ── Subscription ─────────────────────────────────────────────────────────────

export const SUBSCRIPTION = {
  ANNUAL_COST_WARNING_USD: 100,
} as const;

// ── Provider-Specific ────────────────────────────────────────────────────────

export const PROVIDER_DEFAULTS = {
  BITSO_DEFAULT_FEE_RATE: 0.05,
  BITSO_AMOUNT_PRECISION: 100,
  BITSO_TRADE_FETCH_LIMIT: 100,
  BELVO_TRANSACTION_HISTORY_DAYS: 90,
  BELVO_CLABE_LENGTH: 3,
  FINICITY_FETCH_LIMIT: 1000,
  FINICITY_MAX_ACCOUNTS: 20,
  MX_MAX_PAGES: 10,
  CIRCUIT_BREAKER_RETRY_MS: 60_000,
  RATE_LIMITER_DELAY_MS: 200,
} as const;

// ── Retry Counts (provider-specific) ─────────────────────────────────────────

export const PROVIDER_RETRIES = {
  DEFAULT: 5,
  BLOCKCHAIN: 3,
  ZILLOW: 0,
} as const;
