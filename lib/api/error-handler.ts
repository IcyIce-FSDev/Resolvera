import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Generic error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string | Record<string, any>;
}

/**
 * Sanitize error messages for production to prevent information disclosure
 * In development, show detailed error messages for debugging
 */
export function sanitizeError(error: unknown): { message: string; details?: any } {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Zod validation errors - always show detailed validation errors
  if (error instanceof ZodError) {
    return {
      message: 'Validation failed',
      details: isDevelopment
        ? error.issues
        : error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
    };
  }

  // Standard Error objects
  if (error instanceof Error) {
    // In production, hide detailed error messages unless they're safe
    if (!isDevelopment) {
      // Safe error messages that can be shown in production
      const safeMessages = [
        'Unauthorized',
        'Forbidden',
        'Not Found',
        'Bad Request',
        'Validation failed',
        'Invalid credentials',
        'Rate limit exceeded',
      ];

      const isSafeMessage = safeMessages.some((safe) =>
        error.message.toLowerCase().includes(safe.toLowerCase())
      );

      if (isSafeMessage) {
        return { message: error.message };
      }

      // Generic message for production
      return { message: 'An internal server error occurred' };
    }

    // In development, show full error details
    return {
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  // Unknown error type
  if (isDevelopment) {
    return {
      message: 'Unknown error occurred',
      details: typeof error === 'object' ? error : String(error),
    };
  }

  return { message: 'An internal server error occurred' };
}

/**
 * Create a standardized error response
 * Automatically sanitizes errors based on environment
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500
): NextResponse<ErrorResponse> {
  const { message, details } = sanitizeError(error);

  // Log full error details server-side (even in production)
  console.error('[API Error]', {
    message,
    details,
    error: error instanceof Error ? error.stack : error,
  });

  const response: ErrorResponse = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Error handler wrapper for API routes
 * Usage:
 * ```
 * export async function GET(request: NextRequest) {
 *   return handleApiError(async () => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true, data: ... });
 *   });
 * }
 * ```
 */
export async function handleApiError<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Common HTTP error responses
 */
export const Errors = {
  unauthorized: (message = 'Unauthorized') =>
    NextResponse.json(
      { success: false, error: message } as ErrorResponse,
      { status: 401 }
    ),

  forbidden: (message = 'Forbidden') =>
    NextResponse.json(
      { success: false, error: message } as ErrorResponse,
      { status: 403 }
    ),

  notFound: (message = 'Not Found') =>
    NextResponse.json(
      { success: false, error: message } as ErrorResponse,
      { status: 404 }
    ),

  badRequest: (message = 'Bad Request', details?: any) =>
    NextResponse.json(
      {
        success: false,
        error: message,
        ...(details && { details }),
      } as ErrorResponse,
      { status: 400 }
    ),

  conflict: (message = 'Conflict') =>
    NextResponse.json(
      { success: false, error: message } as ErrorResponse,
      { status: 409 }
    ),

  tooManyRequests: (message = 'Too Many Requests') =>
    NextResponse.json(
      { success: false, error: message } as ErrorResponse,
      { status: 429 }
    ),

  internal: (message = 'Internal Server Error') =>
    createErrorResponse(new Error(message), 500),
};
