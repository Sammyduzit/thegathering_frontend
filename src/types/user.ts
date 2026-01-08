/**
 * User response model from backend.
 * Reflects /auth/me, /auth/register, and /auth/login responses.
 */
export type UserResponse = {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  preferred_language: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_active: string | null;
  current_room_id: number | null;
  weekly_message_count: number;
  weekly_message_limit: number;
  weekly_reset_date: string;
};

/**
 * Supported languages from backend (app/core/constants.py).
 * These are the valid values for user.preferred_language.
 */
export const SUPPORTED_LANGUAGES = [
  'en',
  'de',
  'fr',
  'es',
  'it',
  'nl',
  'pl',
  'pt',
  'ru',
  'ja',
  'zh',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * User status values.
 */
export const USER_STATUS = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  AWAY: 'away',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

/**
 * User quota response.
 * GET /auth/users/me/quota
 */
export type UserQuotaResponse = {
  weekly_limit: number;      // -1 = unlimited (Admin)
  used: number;
  remaining: number;
  last_reset_date: string;   // When current week started
  next_reset_date: string;   // When quota will reset (last_reset_date + 7 days)
  percentage_used: number;
};

/**
 * User quota exceeded response (Admin-only).
 * GET /auth/admin/users/quota-exceeded
 */
export type UserQuotaExceededResponse = {
  user_id: number;
  username: string;
  email: string;
  limit: number;
  used: number;
  last_reset_date: string;
  next_reset_date: string;
};
