// Shared API types and interfaces for consistent responses and requests

import { NextRequest, NextResponse } from 'next/server';

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

export interface APIErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId: string;
  details?: unknown;
}

export interface APISuccessResponse<T = unknown> extends APIResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}

// HTTP Status codes for API responses
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Common error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  STORAGE_ERROR: 'STORAGE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Request/Response utility types
export type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string | string[]> }
) => Promise<NextResponse>;

export interface RequestContext {
  requestId: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

// File-related types (specific to this app)
export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  url: string;
  uploadedAt: string;
  checksum?: string;
}

export interface FileUploadRequest {
  file: File;
  metadata?: {
    category?: string;
    tags?: string[];
    description?: string;
  };
}

export interface FileDeleteRequest {
  filename: string;
}

export interface FileListResponse {
  files: UploadedFileInfo[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Logging types
export interface APILogEntry {
  requestId: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  error?: string;
  timestamp: string;
}
