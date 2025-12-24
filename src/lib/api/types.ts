/**
 * TypeScript type definitions for the API
 */

/**
 * Uploaded file information
 */
export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  size: number;
  sizeFormatted: string;
  mimeType: string;
  url: string;
  uploadedAt: string;
  checksum: string;
}

/**
 * File metadata from filesystem
 */
export interface FileMetadata {
  filename: string;
  filepath: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
}

/**
 * API error details
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Request context for logging
 */
export interface APIRequestContext {
  id: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  filename: string;
  message: string;
  metadata?: FileMetadata;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: FileOperationResult[];
  errors?: string[];
}
