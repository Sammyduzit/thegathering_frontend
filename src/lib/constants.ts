/**
 * Backend API base URL.
 * Configured via environment variable or defaults to localhost.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Cookie names (must match backend settings).
 * Backend sets these cookies during login/refresh.
 */
export const COOKIE_NAMES = {
  ACCESS: 'tg_access',
  REFRESH: 'tg_refresh',
  CSRF: 'tg_csrf',
} as const;

/**
 * Memory configuration (must match backend .env).
 * Used for Memory Management UI constraints.
 */
export const MEMORY_CONFIG = {
  MESSAGE_LENGTH: 500,
  MEMORY_TEXT_LENGTH: 500,
  CHUNK_SIZE: 500,
} as const;

/**
 * Pagination defaults for message lists.
 */
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 50,
  INITIAL_PAGE: 1,
} as const;

/**
 * Token expiration times (in minutes).
 * Must match backend settings in app/core/config.py.
 */
export const TOKEN_EXPIRATION = {
  ACCESS_TOKEN_MINUTES: 30,
  REFRESH_TOKEN_DAYS: 7,
} as const;
