/**
 * File management hooks - centralized exports
 */

// File manager hooks
export { useFileManager } from "./useFileManager";

// File upload hooks
export { useFileUpload } from "./useFileUpload";

// Downloaded PDFs management hooks
export { useDownloadedPDFs } from "./useDownloadedPDFs";

// Re-export types for convenience
export type {
  ArchiveFile,
  CategoryInfo,
  StorageStats,
  UseFileManagerResult,
  UseFileManagerOptions,
} from "@/types/archive";
