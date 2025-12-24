/**
 * Configuration constants for file operations and API settings
 */

import path from "path";

/**
 * File configuration constants
 */
export const FILE_CONFIG = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_SIZE_FORMATTED: "50 MB",
  ALLOWED_TYPES: [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,
  ALLOWED_EXTENSIONS: [".pdf", ".txt", ".md", ".docx"] as const,
} as const;

/**
 * Path configuration
 */
export const PATHS = {
  UPLOAD_DIR: path.join(process.cwd(), "public", "uploaded"),
  DEMO_DIR: path.join(process.cwd(), "public", "demo-files"),
  TEMP_DIR: path.join(process.cwd(), "tmp"),
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
  REQUEST_TIMEOUT: 30000, // 30 seconds
  CORS_ORIGINS: [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
  ],
} as const;

/**
 * Validation configuration
 */
export const VALIDATION_CONFIG = {
  MIN_FILENAME_LENGTH: 1,
  MAX_FILENAME_LENGTH: 255,
  ALLOWED_FILENAME_CHARS: /^[a-zA-Z0-9._\-\s]+$/,
} as const;
