/**
 * Response utility functions for Next.js API routes
 */

import { NextRequest } from "next/server";

/**
 * Request context for logging and debugging
 */
export interface RequestContext {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

/**
 * API Response structure
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  requestId: string;
  timestamp: string;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create request context from NextRequest
 */
export function createRequestContext(request: NextRequest): RequestContext {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
  };
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200,
  requestId?: string,
): Response {
  const response: APIResponse<T> = {
    success: true,
    data,
    message,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, unknown> | unknown[],
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: "Validation failed",
    data: errors,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create file not found error response
 */
export function createFileNotFoundResponse(
  filename: string,
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: `File not found: ${filename}`,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create file too large error response
 */
export function createFileTooLargeResponse(
  maxSize: string,
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: `File too large. Maximum allowed size: ${maxSize}`,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 413,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create invalid file type error response
 */
export function createInvalidFileTypeResponse(
  allowedTypes: string[],
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create storage error response
 */
export function createStorageErrorResponse(
  operation: string,
  details?: string,
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: `Storage operation failed: ${operation}${details ? ` - ${details}` : ""}`,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create bad request error response
 */
export function createBadRequestResponse(
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: message,
    data: details,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}

/**
 * Create internal server error response
 */
export function createInternalServerErrorResponse(
  message: string = "An unexpected error occurred",
  error?: unknown,
  requestId?: string,
): Response {
  const response: APIResponse = {
    success: false,
    error: message,
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  // Log error details for debugging (in production, use proper logging)
  if (error) {
    console.error(`[${response.requestId}] Internal error:`, error);
  }

  return new Response(JSON.stringify(response), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": response.requestId,
    },
  });
}
