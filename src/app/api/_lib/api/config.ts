// API configuration and constants
import { mkdirSync } from 'fs';

// File upload configuration
export const FILE_CONFIG = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_SIZE_FORMATTED: '50MB',
  ALLOWED_TYPES: ['application/pdf'] as const,
  ALLOWED_EXTENSIONS: ['.pdf'] as const,
  UPLOAD_DIR: 'public/uploaded',
} as const;

// API rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // requests per window
  UPLOAD_MAX_REQUESTS: 10, // uploads per window
  DELETE_MAX_REQUESTS: 50, // deletes per window
} as const;

// Pagination defaults
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Search configuration
export const SEARCH_CONFIG = {
  MAX_QUERY_LENGTH: 500,
  MAX_RESULTS: 100,
  DEFAULT_SORT_BY: 'relevance' as const,
  DEFAULT_SORT_ORDER: 'desc' as const,
} as const;

// Crawl configuration
export const CRAWL_CONFIG = {
  MAX_DEPTH: 5,
  MAX_PAGES: 100,
  DEFAULT_DEPTH: 2,
  DEFAULT_MAX_PAGES: 50,
  TIMEOUT_MS: 60000, // 1 minute
} as const;

// Chat configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_CONTEXT_LENGTH: 50000,
  TIMEOUT_MS: 60000, // 1 minute
} as const;

// Error retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL_MS: 5 * 60 * 1000, // 5 minutes
  LONG_TTL_MS: 30 * 60 * 1000, // 30 minutes
  SHORT_TTL_MS: 60 * 1000, // 1 minute
} as const;

// Logging configuration
export const LOG_CONFIG = {
  MAX_LOG_ENTRIES: 1000,
  LOG_RETENTION_DAYS: 7,
  SENSITIVE_FIELDS: ['password', 'token', 'key', 'secret'],
} as const;

// API versioning
export const API_VERSION = 'v1';

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  TRUSTED_PROXIES: process.env.TRUSTED_PROXIES?.split(',') || [],
  API_KEY_HEADER: 'x-api-key',
  AUTH_TOKEN_HEADER: 'authorization',
} as const;

// Database/file system paths
export const PATHS = {
  UPLOAD_DIR: process.cwd() + '/' + FILE_CONFIG.UPLOAD_DIR,
  LOGS_DIR: process.cwd() + '/logs',
  CACHE_DIR: process.cwd() + '/.cache',
} as const;

// Utility functions for configuration
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value || defaultValue!;
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

export function getEnvVarAsBoolean(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

// Validate configuration on startup
export function validateConfiguration(): void {
  const errors: string[] = [];

  // Check required directories exist or can be created
  try {
    mkdirSync(PATHS.UPLOAD_DIR, { recursive: true });
  } catch (error) {
    errors.push(`Cannot create upload directory: ${PATHS.UPLOAD_DIR}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
