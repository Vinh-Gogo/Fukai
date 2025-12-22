/**
 * Core types and interfaces for PDF processing functionality
 */

/**
 * Represents a PDF file with all its metadata and processing status
 */
export interface PDFFile {
  /** Unique identifier for the PDF file */
  id: string;
  /** Display name of the PDF file */
  name: string;
  /** File size in human-readable format (e.g., "2.4 MB") */
  size: string;
  /** Current processing status of the PDF */
  status: PDFFileStatus;
  /** Upload timestamp in ISO format */
  uploadDate: string;
  /** Source URL or path to the PDF file */
  sourceUrl: string;
  /** Total number of pages in the PDF */
  pages: number;
  /** Detected language of the PDF content */
  language: string;
}

/**
 * Possible processing statuses for PDF files
 */
export type PDFFileStatus = "pending" | "processing" | "completed" | "error";

/**
 * Upload progress information for file uploads
 */
export interface UploadProgress {
  /** Unique identifier for the upload */
  id: string;
  /** Name of the file being uploaded */
  fileName: string;
  /** Upload progress as percentage (0-100) */
  progress: number;
  /** Current upload status */
  status: UploadStatus;
  /** Optional error message if upload failed */
  error?: string;
  /** File size in human-readable format */
  size: string;
  /** Reference to the actual File object */
  file: File;
}

/**
 * Possible upload statuses
 */
export type UploadStatus = "uploading" | "completed" | "error";

/**
 * Props for components that display file information
 */
export interface FileDisplayProps {
  /** The PDF file to display */
  file: PDFFile;
  /** Whether this file is currently selected */
  isSelected?: boolean;
  /** Callback when the file is clicked */
  onClick?: (file: PDFFile) => void;
}

/**
 * Props for table row components
 */
export interface TableRowProps extends FileDisplayProps {
  /** Callback when download button is clicked */
  onDownloadClick?: () => void;
}

/**
 * Props for PDF viewer components
 */
export interface PDFViewerProps {
  /** The PDF file to display */
  file: PDFFile;
  /** Callback when viewer should be closed */
  onClose: () => void;
}

/**
 * Props for page content components
 */
export interface PageContentProps {
  /** Page number to display (1-indexed) */
  pageNumber: number;
  /** The PDF file containing this page */
  file: PDFFile;
  /** Current zoom level (1.0 = 100%) */
  zoomLevel: number;
  /** Whether this page is currently loading */
  isLoading?: boolean;
}

/**
 * Configuration for virtualization
 */
export interface VirtualizationConfig {
  /** Height of the container in pixels */
  containerHeight: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of buffer items to render outside viewport */
  bufferSize?: number;
}

/**
 * Return type for virtualization hooks
 */
export interface VirtualizationResult<T = unknown> {
  /** Items currently visible in the viewport */
  visibleItems: T[];
  /** Index of the first visible item */
  startIndex: number;
  /** Total number of items */
  totalItems: number;
  /** Scroll event handler */
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Height of each item */
  itemHeight: number;
}

/**
 * Return type for PDF virtualization hooks
 */
export interface PDFVirtualizationResult {
  /** Page numbers currently visible */
  visiblePages: number[];
  /** Current page number */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Reference to the scroll container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Function to navigate to a specific page */
  goToPage: (page: number) => void;
  /** Current zoom level */
  zoomLevel: number;
  /** Function to set zoom level */
  setZoom: (level: number) => void;
  /** Calculated page height with zoom applied */
  pageHeight: number;
}

/**
 * Props for upload zone components
 */
export interface FileUploadZoneProps {
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Accepted file types (default: '.pdf') */
  accept?: string;
  /** Maximum file size in MB (default: 50) */
  maxSize?: number;
  /** Whether the upload zone is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for upload progress components
 */
export interface UploadProgressBarProps {
  /** Upload progress information */
  upload: UploadProgress;
  /** Callback to cancel the upload */
  onCancel?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Utility type for component props with optional children
 */
export interface ComponentWithChildren {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Type guard to check if a file is a PDFFile
 */
export const isPDFFile = (file: unknown): file is PDFFile => {
  const obj = file as Record<string, unknown>;
  return (
    file !== null &&
    typeof file === "object" &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.size === "string" &&
    typeof obj.status === "string" &&
    ["pending", "processing", "completed", "error"].includes(obj.status) &&
    typeof obj.uploadDate === "string" &&
    typeof obj.sourceUrl === "string" &&
    typeof obj.pages === "number" &&
    typeof obj.language === "string"
  );
};

/**
 * Type guard to check if an upload is completed
 */
export const isUploadCompleted = (upload: UploadProgress): boolean => {
  return upload.status === "completed";
};

/**
 * Type guard to check if an upload has failed
 */
export const isUploadFailed = (upload: UploadProgress): boolean => {
  return upload.status === "error";
};
