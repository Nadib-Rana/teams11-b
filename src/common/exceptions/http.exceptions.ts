/**
 * src/common/exceptions/http.exceptions.ts
 * * This file contains specific, reusable HTTP exceptions
 * * that extend our custom BaseException.
 * * UPDATED: All constructors now accept 'instruction' and 'details'
 * * fields as the last parameters (details is unknown).
 */

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';
import { ErrorDetail } from '../dto/api-error-response.dto';

// --- 400 - Bad Request ---
export class BadRequestException extends BaseException {
  constructor(
    message = 'Bad request',
    code = 'BAD_REQUEST',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(message, HttpStatus.BAD_REQUEST, code, errors, instruction, details);
  }
}

// --- 401 - Unauthorized ---
export class UnauthorizedException extends BaseException {
  constructor(
    message = 'Authentication required',
    code = 'AUTHENTICATION_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(message, HttpStatus.UNAUTHORIZED, code, errors, instruction, details);
  }
}

// --- 403 - Forbidden ---
export class ForbiddenException extends BaseException {
  constructor(
    message = 'Insufficient permissions',
    code = 'AUTHORIZATION_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(message, HttpStatus.FORBIDDEN, code, errors, instruction, details);
  }
}

// --- 404 - Not Found ---
export class NotFoundException extends BaseException {
  constructor(
    resource = 'Resource',
    message?: string,
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(
      message || `${resource} not found`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
      errors,
      instruction,
      details,
    );
  }
}

// --- 409 - Conflict ---
export class ConflictException extends BaseException {
  constructor(
    message = 'Resource conflict',
    code = 'CONFLICT_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(message, HttpStatus.CONFLICT, code, errors, instruction, details);
  }
}

// --- 413 - Payload Too Large ---
export class PayloadTooLargeException extends BaseException {
  constructor(
    message = 'Payload too large',
    code = 'PAYLOAD_TOO_LARGE',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(
      message,
      HttpStatus.PAYLOAD_TOO_LARGE,
      code,
      errors,
      instruction,
      details,
    );
  }
}

// --- 429 - Too Many Requests ---
export class RateLimitException extends BaseException {
  constructor(
    message = 'Too many requests',
    code = 'RATE_LIMIT_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      code,
      errors,
      instruction,
      details,
    );
  }
}

// --- 500 - Internal Server ---
export class InternalServerException extends BaseException {
  constructor(
    message = 'Internal server error',
    code = 'INTERNAL_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      code,
      errors,
      instruction,
      details,
    );
  }
}

// --- 502 - Bad Gateway ---
export class ExternalServiceException extends BaseException {
  constructor(
    message = 'External service error',
    code = 'EXTERNAL_SERVICE_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(message, HttpStatus.BAD_GATEWAY, code, errors, instruction, details);
  }
}

// --- 504 - Gateway Timeout ---
export class TimeoutException extends BaseException {
  constructor(
    message = 'Request timeout',
    code = 'TIMEOUT_ERROR',
    errors?: ErrorDetail[],
    instruction?: string, // <-- ADDED
    details?: unknown, // <-- CHANGED to unknown
  ) {
    super(
      message,
      HttpStatus.REQUEST_TIMEOUT,
      code,
      errors,
      instruction,
      details,
    );
  }
}
