/**
 * Validation functions for file operations and API requests
 */

import path from "path";
import { FILE_CONFIG, PATHS, VALIDATION_CONFIG } from "./config";

/**
 * Validation result interface
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate file upload request
 */
export function validateFileUpload(formData: FormData): ValidationResult<{ file: File }> {
  const errors: string[] = [];

  // Check if formData is provided
  if (!formData) {
    errors.push("Form data is required");
    return { success: false, errors };
  }

  // Get the file from form data
  const file = formData.get("file") as File | null;

  if (!file) {
    errors.push("No file provided in form data");
    return { success: false, errors };
  }

  // Validate file size
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    errors.push(`File size ${file.size} bytes exceeds maximum allowed size of ${FILE_CONFIG.MAX_SIZE} bytes`);
  }

  // Validate file type
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type as (typeof FILE_CONFIG.ALLOWED_TYPES)[number])) {
    errors.push(`File type "${file.type}" is not allowed. Allowed types: ${FILE_CONFIG.ALLOWED_TYPES.join(", ")}`);
  }

  // Validate filename
  if (!file.name || file.name.trim().length === 0) {
    errors.push("Filename is required");
  } else if (file.name.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    errors.push(`Filename is too long. Maximum length is ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} characters`);
  } else if (!VALIDATION_CONFIG.ALLOWED_FILENAME_CHARS.test(file.name)) {
    errors.push("Filename contains invalid characters. Only letters, numbers, spaces, dots, hyphens, and underscores are allowed");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { file } };
}

/**
 * Validate file delete request
 */
export function validateFileDelete(searchParams: URLSearchParams): ValidationResult<{ filename: string }> {
  const errors: string[] = [];

  // Get filename from query parameters
  const filename = searchParams.get("filename");

  if (!filename) {
    errors.push("Filename parameter is required");
    return { success: false, errors };
  }

  // Validate filename format (should be /uploaded/filename.ext)
  if (!filename.startsWith("/uploaded/")) {
    errors.push("Invalid filename format. Must start with '/uploaded/'");
  } else {
    const basename = filename.replace("/uploaded/", "");

    if (basename.length === 0) {
      errors.push("Filename cannot be empty");
    } else if (basename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
      errors.push(`Filename is too long. Maximum length is ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} characters`);
    } else if (!VALIDATION_CONFIG.ALLOWED_FILENAME_CHARS.test(basename)) {
      errors.push("Filename contains invalid characters");
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { filename } };
}

/**
 * Validate filename format
 */
export function validateFilename(filename: string): ValidationResult<string> {
  const errors: string[] = [];

  if (!filename || filename.trim().length === 0) {
    errors.push("Filename is required");
  } else if (filename.length > VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    errors.push(`Filename is too long. Maximum length is ${VALIDATION_CONFIG.MAX_FILENAME_LENGTH} characters`);
  } else if (!VALIDATION_CONFIG.ALLOWED_FILENAME_CHARS.test(filename)) {
    errors.push("Filename contains invalid characters. Only letters, numbers, spaces, dots, hyphens, and underscores are allowed");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: filename };
}

/**
 * Check if file path is within allowed directories
 */
export function validateFilePath(filepath: string): ValidationResult<string> {
  const errors: string[] = [];

  // Ensure the path is within the upload directory
  const uploadDir = PATHS.UPLOAD_DIR;
  const resolvedPath = path.resolve(filepath);

  if (!resolvedPath.startsWith(uploadDir)) {
    errors.push("File path is outside of allowed directory");
  }

  // Check for directory traversal attempts
  if (filepath.includes("..") || filepath.includes("\\") && !filepath.includes("\\\\")) {
    errors.push("Invalid file path: directory traversal not allowed");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: filepath };
}
