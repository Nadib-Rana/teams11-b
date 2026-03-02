/**
 * src/common/dto/api-error-response.dto.ts
 * * This DTO defines the standard structure for all error responses.
 * * UPDATED: Now includes optional 'instruction', 'details', and 'stack' fields.
 */

/**
 * Defines the shape of a single error detail.
 * This is particularly useful for validation errors,
 * where 'field' can specify which part of the DTO failed.
 */
export class ErrorDetail {
  /**
   * An application-specific error code.
   * @example "VALIDATION_ERROR"
   */
  code: string;

  /**
   * A human-readable message describing the error.
   * @example "email must be a valid email address"
   */
  message: string;

  /**
   * The specific field that caused the error (optional).
   * @example "email"
   */
  field?: string;
}

export class ApiErrorResponseDto {
  /**
   * Indicates that the request was not successful.
   * @example false
   */
  readonly success: boolean = false;

  /**
   * The HTTP Status code.
   * @example 404
   */
  readonly statusCode: number; // <-- ADDED THIS

  /**
   * A high-level, human-readable summary of the error.
   * @example "Validation Failed"
   */
  readonly message: string;

  /**
   * The unique request ID, retrieved from the ContextService.
   * @example "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   */
  readonly requestId: string | null;

  /**
   * The server timestamp when the error was generated.
   * @example "2025-11-16T03:55:00.00Z"
   */
  readonly timestamp: string;

  /**
   * The API endpoint path that was called.
   * @example "/v1/users"
   */
  readonly path: string;

  /**
   * An array of one or more detailed errors.
   */
  readonly errors: ErrorDetail[];

  /**
   * (Optional) A frontend-specific instruction or action code.
   * @example "LOGOUT_USER"
   */
  readonly instruction?: string; // <-- ADDED THIS

  /**
   * (Optional) An object containing extra details for the frontend.
   * @example { "needOtpVerification": true, "remainingAttempts": 2 }
   */
  readonly details?: unknown; // <-- CHANGED from any to unknown

  /**
   * (Optional) The error stack trace.
   * Only included in non-production environments.
   * @example "Error: Something went wrong..."
   */
  readonly stack?: string; // <-- ADDED THIS

  constructor(
    statusCode: number, // <-- ADDED THIS
    message: string,
    errors: ErrorDetail[],
    path: string,
    requestId: string | null,
    instruction?: string, // <-- ADDED THIS
    details?: unknown, // <-- CHANGED from any to unknown
    stack?: string, // <-- ADDED THIS
  ) {
    this.statusCode = statusCode; // <-- ADDED THIS
    this.message = message;
    this.errors = errors;
    this.path = path;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
    this.instruction = instruction; // <-- ADDED THIS
    this.details = details; // <-- ADDED THIS
    this.stack = stack; // <-- ADDED THIS
  }
}
