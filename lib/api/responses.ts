import { NextResponse } from 'next/server';
import { createErrorResponse, Errors } from './error-handler';

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

/**
 * Create a standardized success response
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @param meta - Optional metadata (pagination, etc.)
 */
export function successResponse<T = any>(
  data: T,
  status: number = 200,
  meta?: Record<string, any>
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized error response
 * Wrapper around error-handler for consistency
 * @param error - The error (string, Error, or unknown)
 * @param status - HTTP status code
 */
export function errorResponse(error: unknown, status: number = 500): NextResponse {
  // If it's a simple string, convert to Error
  if (typeof error === 'string') {
    return createErrorResponse(new Error(error), status);
  }

  return createErrorResponse(error, status);
}

/**
 * Create a validation error response
 * @param errors - Array of validation errors
 */
export function validationErrorResponse(
  errors: Array<{ path: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Re-export common error helpers for convenience
 */
export { Errors };
