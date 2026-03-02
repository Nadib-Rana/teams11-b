/**
 * src/common/exceptions/base.exception.ts
 * * Defines a custom base exception class.
 * * UPDATED: Now includes optional 'instruction' and 'details' fields.
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorDetail } from '../dto/api-error-response.dto';

/**
 * A custom base exception that allows for a structured
 * error response, including an application-specific error code.
 *
 * @example
 * throw new BaseException(
 * "Login failed, please verify OTP",
 * HttpStatus.UNAUTHORIZED,
 * "OTP_REQUIRED",
 * [],
 * "REQUIRE_OTP_VERIFICATION",
 * { "needOtpVerification": true } // <-- New details field
 * );
 */
export class BaseException extends HttpException {
  public readonly code: string;
  public readonly errors: ErrorDetail[];
  public readonly instruction?: string; // <-- ADDED THIS
  public readonly details?: unknown; // <-- CHANGED from any to unknown

  /**
   * @param message A high-level, human-readable summary of the error.
   * @param status The HTTP status code.
   * @param code An application-specific error code (e.g., "VALIDATION_ERROR").
   * @param errors An optional array of detailed errors.
   * @param instruction An optional frontend-specific action code.
   * @param details An optional object with extra data for the frontend.
   */
  constructor(
    message: string,
    status: HttpStatus,
    code: string,
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED THIS
    details?: unknown, // <-- CHANGED from any to unknown
  ) {
    // Call HttpException constructor with the message and status
    super(
      {
        message,
        code,
        errors:
          errors ||
          (message ? [{ code, message: message, field: undefined }] : []),
        instruction, // <-- ADDED THIS
        details, // <-- ADDED THIS
      },
      status,
    );

    // Store custom properties
    this.code = code;
    this.errors =
      errors || (message ? [{ code, message: message, field: undefined }] : []);
    this.instruction = instruction; // <-- ADDED THIS
    this.details = details; // <-- ADDED THIS
  }
}
