// API response utilities for consistent formatting and error handling

import { NextResponse } from 'next/server';
import {
  APIResponse,
  APIErrorResponse,
  APISuccessResponse,
  HTTP_STATUS,
  ERROR_CODES,
  RequestContext,
  ValidationResult
} from '../api/types';

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create request context
export function createRequestContext(request: Request): RequestContext {
  const headers = new Headers(request.headers);
  return {
    requestId: generateRequestId(),
    timestamp: new Date(),
    userAgent: headers.get('user-agent') || undefined,
    ip: headers.get('x-forwarded-for')?.split(',')[0] ||
        headers.get('x-real-ip') ||
        'unknown',
  };
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  requestId?: string
): NextResponse<APISuccessResponse<T>> {
  const response: APISuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
  };

  return NextResponse.json(response, { status });
}

// Error response helper
export function createErrorResponse(
  error: string,
  message?: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: unknown,
  requestId?: string
): NextResponse<APIErrorResponse> {
  const response: APIErrorResponse = {
    success: false,
    error,
    message,
    code,
    timestamp: new Date().toISOString(),
    requestId: requestId || generateRequestId(),
    details,
  };

  return NextResponse.json(response, { status });
}

// Validation error response
export function createValidationErrorResponse(
  validationResult: ValidationResult,
  requestId?: string
): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'Validation failed',
    'One or more fields are invalid',
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    ERROR_CODES.VALIDATION_ERROR,
    { errors: validationResult.errors },
    requestId
  );
}

// File operation error responses
export function createFileTooLargeResponse(maxSize: string, requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'File too large',
    `File size exceeds the maximum limit of ${maxSize}`,
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.FILE_TOO_LARGE,
    { maxSize },
    requestId
  );
}

export function createInvalidFileTypeResponse(allowedTypes: string[], requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'Invalid file type',
    `Only the following file types are allowed: ${allowedTypes.join(', ')}`,
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.INVALID_FILE_TYPE,
    { allowedTypes },
    requestId
  );
}

export function createFileNotFoundResponse(filename: string, requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'File not found',
    `The file '${filename}' does not exist`,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.FILE_NOT_FOUND,
    { filename },
    requestId
  );
}

export function createStorageErrorResponse(operation: string, error?: string, requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'Storage operation failed',
    `Failed to ${operation} file${error ? `: ${error}` : ''}`,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.STORAGE_ERROR,
    { operation, error },
    requestId
  );
}

// Rate limit response
export function createRateLimitResponse(
  limit: number,
  remaining: number,
  resetTime: number,
  requestId?: string
): NextResponse<APIErrorResponse> {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', resetTime.toString());

  const response = createErrorResponse(
    'Rate limit exceeded',
    'Too many requests. Please try again later.',
    429, // HTTP 429 Too Many Requests
    ERROR_CODES.RATE_LIMITED,
    {
      limit,
      remaining,
      resetTime,
      resetInSeconds: Math.ceil((resetTime - Date.now()) / 1000)
    },
    requestId
  );

  // Add rate limit headers to the response
  Object.entries(Object.fromEntries(headers.entries())).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Bad request response
export function createBadRequestResponse(message: string, details?: unknown, requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'Bad request',
    message,
    HTTP_STATUS.BAD_REQUEST,
    undefined,
    details,
    requestId
  );
}

// Not found response
export function createNotFoundResponse(resource: string, requestId?: string): NextResponse<APIErrorResponse> {
  return createErrorResponse(
    'Not found',
    `The requested ${resource} was not found`,
    HTTP_STATUS.NOT_FOUND,
    undefined,
    { resource },
    requestId
  );
}

// Internal server error response
export function createInternalServerErrorResponse(
  message?: string,
  error?: unknown,
  requestId?: string
): NextResponse<APIErrorResponse> {
  // Log the error for debugging (in production, you'd want proper logging)
  console.error('Internal server error:', error);

  return createErrorResponse(
    'Internal server error',
    message || 'An unexpected error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? error : undefined,
    requestId
  );
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create standardized headers
export function createStandardHeaders(requestId: string): Record<string, string> {
  return {
    'X-Request-ID': requestId,
    'X-API-Version': 'v1',
    'X-Powered-By': 'Next.js',
  };
}
