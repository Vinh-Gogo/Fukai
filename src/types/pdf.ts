/**
 * Centralized PDF-related types and interfaces
 */

// PDF.js Core Types
export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  getMetadata(): Promise<PDFMetadata>;
  destroy(): void;
}

export interface PDFPageProxy {
  pageNumber: number;
  getViewport(options: { scale: number }): PDFViewport;
  render(options: PDFRenderOptions): PDFRenderTaskProxy;
  getTextContent(): Promise<PDFTextContent>;
}

export interface PDFViewport {
  height: number;
  width: number;
}

export interface PDFRenderOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

export interface PDFRenderTaskProxy {
  promise: Promise<void>;
  cancel(): void;
}

export interface PDFMetadata {
  info: PDFInfo;
}

export interface PDFInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
}

export interface PDFTextContent {
  items: Array<{ str: string; [key: string]: unknown }>;
}

// PDF Document Information
export interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// PDF File Types
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
  /** URL to generated markdown (if converted) */
  markdownUrl?: string;
  /** Total number of pages in the PDF */
  pages: number;
  /** Detected language of the PDF content */
  language: string;
  /** Quality assessment of the PDF */
  quality?: "high" | "medium" | "low";
}

export type PDFFileStatus = "pending" | "processing" | "completed" | "error";

// Upload Types
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

export type UploadStatus = "uploading" | "completed" | "error";

// PDF Rendering Types
export interface PDFRenderTask {
  id: string;
  task: PDFRenderTaskProxy;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  cancelled: boolean;
}

// Error Types
export interface PDFError {
  type:
    | "network"
    | "corrupted"
    | "unsupported"
    | "timeout"
    | "permission"
    | "unknown";
  message: string;
  originalError?: Error;
  retryable: boolean;
  userMessage: string;
}

export interface PDFLoaderError extends PDFError {
  url?: string;
  retryCount?: number;
}

export interface PDFRenderError {
  type: "canvas" | "render" | "memory" | "timeout" | "unknown";
  message: string;
  originalError?: Error;
  pageNumber?: number;
  retryable: boolean;
  userMessage: string;
}

// Hook Result Types
export interface UsePDFLoaderResult {
  pdfDoc: PDFDocumentProxy | null;
  isLoading: boolean;
  error: string | null;
  metadata: PDFDocumentInfo | null;
  isValid: boolean;
  loadPDF: (url: string) => Promise<void>;
  unloadPDF: () => void;
  retry: () => Promise<void>;
  isSupported: boolean;
}

export interface UsePDFRendererResult {
  renderPage: (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    pdfDoc?: PDFDocumentProxy,
    scale?: number,
  ) => Promise<void>;
  cancelAllRenders: () => void;
  cleanup: () => void;
  calculateScale: (
    containerWidth: number,
    pageWidth: number,
    zoomLevel?: number,
  ) => number;
  activeRenders: PDFRenderTask[];
  isRendering: boolean;
}

// Component Props Types
export interface FileDisplayProps {
  /** The PDF file to display */
  file: PDFFile;
  /** Whether this file is currently selected */
  isSelected?: boolean;
  /** Callback when the file is clicked */
  onClick?: (file: PDFFile) => void;
}

export interface TableRowProps extends FileDisplayProps {
  /** Callback when download button is clicked */
  onDownloadClick?: () => void;
}

export interface PDFViewerProps {
  /** The PDF file to display */
  file: PDFFile;
  /** Callback when viewer should be closed */
  onClose: () => void;
}

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

export interface UploadProgressBarProps {
  /** Upload progress information */
  upload: UploadProgress;
  /** Callback to cancel the upload */
  onCancel?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// Virtualization Types
export interface VirtualizationConfig {
  /** Height of the container in pixels */
  containerHeight: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of buffer items to render outside viewport */
  bufferSize?: number;
}

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

// Utility Types
export interface ComponentWithChildren {
  children?: React.ReactNode;
  className?: string;
}

// Type Guards
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

export const isUploadCompleted = (upload: UploadProgress): boolean => {
  return upload.status === "completed";
};

export const isUploadFailed = (upload: UploadProgress): boolean => {
  return upload.status === "error";
};
