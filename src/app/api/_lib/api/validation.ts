// API validation utilities using Zod for type-safe input validation

import { z } from 'zod';
import { ValidationError, ValidationResult } from './types';

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file: File) => file.size > 0, 'File cannot be empty')
    .refine((file: File) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
      'Only PDF files are allowed'
    ),
});

// File delete validation schema
export const fileDeleteSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .regex(/^\/uploaded\/.+/, 'Invalid file path format')
    .transform((filename: string) => filename.replace('/uploaded/', '')), // Extract filename
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

// Search query validation schema
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  filters: z.object({
    types: z.array(z.enum(['pdf', 'chat', 'metadata'])).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }).optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    fileSize: z.object({
      min: z.number().min(0),
      max: z.number().min(0),
    }).optional(),
    language: z.string().optional(),
    hasText: z.boolean().optional(),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['relevance', 'date', 'title', 'size']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Crawl job validation schema
export const crawlJobSchema = z.object({
  url: z.string().url('Invalid URL format'),
  maxDepth: z.number().int().min(1).max(5).default(2),
  maxPages: z.number().int().min(1).max(100).default(50),
  includePatterns: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
});

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  context: z.unknown().optional(),
  conversationId: z.string().uuid().optional(),
});

// Activity logging validation schema
export const activityLogSchema = z.object({
  type: z.string().min(1, 'Activity type is required'),
  action: z.string().min(1, 'Activity action is required'),
  details: z.unknown().optional(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Generic validation helper
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return { success: false, errors };
    }

    // Unexpected error
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed due to unexpected error' }],
    };
  }
}

// Create validation result from Zod errors
export function createValidationResult(errors: z.ZodError): ValidationResult {
  return {
    isValid: false,
    errors: errors.issues.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    })),
  };
}

// Validate file upload
export function validateFileUpload(formData: FormData) {
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return {
      success: false,
      errors: [{ field: 'file', message: 'No file provided or invalid file' }],
    };
  }

  return validateData(fileUploadSchema, { file });
}

// Validate file delete
export function validateFileDelete(searchParams: URLSearchParams) {
  const filename = searchParams.get('filename');

  if (!filename) {
    return {
      success: false,
      errors: [{ field: 'filename', message: 'Filename parameter is required' }],
    };
  }

  return validateData(fileDeleteSchema, { filename });
}

// Validate pagination parameters
export function validatePagination(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (['page', 'limit', 'offset'].includes(key)) {
      params[key] = value;
    }
  }

  return validateData(paginationSchema, params);
}

// Validate search query
export function validateSearchQuery(data: unknown) {
  return validateData(searchQuerySchema, data);
}

// Validate crawl job
export function validateCrawlJob(data: unknown) {
  return validateData(crawlJobSchema, data);
}

// Validate chat message
export function validateChatMessage(data: unknown) {
  return validateData(chatMessageSchema, data);
}

// Validate activity log
export function validateActivityLog(data: unknown) {
  return validateData(activityLogSchema, data);
}

// File type validation helpers
export const ALLOWED_FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
} as const;

export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type) ||
         allowedTypes.some(type => file.name.toLowerCase().endsWith(type.split('/')[1]));
}

export function getFileTypeCategory(mimeType: string): string {
  if ((ALLOWED_FILE_TYPES.PDF as readonly string[]).includes(mimeType)) return 'pdf';
  if ((ALLOWED_FILE_TYPES.IMAGES as readonly string[]).includes(mimeType)) return 'image';
  if ((ALLOWED_FILE_TYPES.DOCUMENTS as readonly string[]).includes(mimeType)) return 'document';
  return 'unknown';
}
