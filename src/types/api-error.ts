import { ApiError } from '@/lib/client-api';

/**
 * Standardized backend error response.
 * All domain exceptions from FastAPI use this format.
 */
export type BackendErrorResponse = {
  detail: string;
  error_code: string;
  timestamp: string;
};

/**
 * Type guard to check if an error is a backend error with error_code.
 *
 * @param error - The error to check
 * @returns True if error is an ApiError with a BackendErrorResponse payload
 *
 * @example
 * ```ts
 * try {
 *   await apiFetch('/api/users/123');
 * } catch (err) {
 *   if (isBackendError(err)) {
 *     console.log(err.data.error_code); // Type-safe access
 *   }
 * }
 * ```
 */
export function isBackendError(
  error: unknown
): error is ApiError<BackendErrorResponse> {
  return (
    error instanceof ApiError &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'error_code' in error.data &&
    typeof (error.data as BackendErrorResponse).error_code === 'string'
  );
}

/**
 * Extract error message from various error types.
 *
 * Handles:
 * - ApiError with BackendErrorResponse (uses detail)
 * - ApiError with other payloads (builds message from data)
 * - Standard Error objects (uses message)
 * - Unknown errors (returns generic message)
 *
 * @param error - The error to extract message from
 * @returns Human-readable error message
 *
 * @example
 * ```ts
 * try {
 *   await createConversation({ ... });
 * } catch (err) {
 *   toast.error(getErrorMessage(err));
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (isBackendError(error)) {
    return error.data.detail;
  }

  if (error instanceof ApiError) {
    // Fallback for non-standard error responses
    if (error.data && typeof error.data === 'object') {
      const data = error.data as Record<string, unknown>;
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        // Pydantic validation errors
        const entry = data.detail[0];
        if (entry && typeof entry === 'object' && 'msg' in entry) {
          return String((entry as Record<string, unknown>).msg);
        }
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ein unbekannter Fehler ist aufgetreten';
}

/**
 * Extract error code from backend error.
 *
 * Returns null if error is not a backend error or has no error_code.
 *
 * @param error - The error to extract code from
 * @returns Error code string or null
 *
 * @example
 * ```ts
 * try {
 *   await deleteRoom(roomId);
 * } catch (err) {
 *   const code = getErrorCode(err);
 *   if (code === 'ROOM_NOT_FOUND') {
 *     // Handle specific error
 *   }
 * }
 * ```
 */
export function getErrorCode(error: unknown): string | null {
  if (isBackendError(error)) {
    return error.data.error_code;
  }
  return null;
}

/**
 * Common backend error codes for type-safe error handling.
 *
 * @example
 * ```ts
 * if (getErrorCode(err) === BackendErrorCode.CONVERSATION_NOT_FOUND) {
 *   // Handle conversation not found
 * }
 * ```
 */
export const BackendErrorCode = {
  // User errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',

  // Room errors
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  USER_NOT_IN_ROOM: 'USER_NOT_IN_ROOM',
  ROOM_NAME_ALREADY_EXISTS: 'ROOM_NAME_ALREADY_EXISTS',

  // Conversation errors
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  NOT_CONVERSATION_PARTICIPANT: 'NOT_CONVERSATION_PARTICIPANT',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
  PARTICIPANT_ALREADY_IN_CONVERSATION: 'PARTICIPANT_ALREADY_IN_CONVERSATION',

  // AI errors
  AI_ENTITY_NOT_FOUND: 'AI_ENTITY_NOT_FOUND',
  AI_ALREADY_IN_ROOM: 'AI_ALREADY_IN_ROOM',

  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',

  // Quota errors
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export type BackendErrorCodeType =
  (typeof BackendErrorCode)[keyof typeof BackendErrorCode];
