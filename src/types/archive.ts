/**
 * Centralized archive and file management types and interfaces
 */

// Core Archive Types
export interface ArchiveFile {
  id: string;
  name: string;
  size: string;
  sourceUrl: string;
  downloadDate: string;
  type: string;
  category: string;
  tags: string[];
  isDownloaded: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  averageSize: number;
}

// Sorting and Filtering Types
export type SortField = "name" | "date" | "size";
export type SortOrder = "asc" | "desc";
export type FileCategory = "all" | "recent" | string;

// Hook Result Types
export interface UseFileManagerResult {
  // State
  files: ArchiveFile[];
  selectedFiles: Set<string>;
  searchQuery: string;
  selectedCategory: FileCategory;
  sortBy: SortField;
  sortOrder: SortOrder;

  // Computed values
  storageStats: StorageStats;
  categoryCounts: CategoryInfo[];
  filteredFiles: ArchiveFile[];

  // File operations
  addFile: (file: ArchiveFile) => void;
  removeFile: (fileId: string) => void;
  updateFile: (fileId: string, updates: Partial<ArchiveFile>) => void;
  removeSelectedFiles: () => void;

  // Selection operations
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;

  // Sorting operations
  handleSort: (field: SortField) => void;

  // Search operations
  handleSearch: (query: string) => void;

  // Category operations
  handleCategoryChange: (category: FileCategory) => void;
}

export interface UseFileManagerOptions {
  initialFiles?: ArchiveFile[];
  categories: CategoryInfo[];
}

// Component Props Types
export interface FileCardProps {
  file: ArchiveFile;
  isSelected?: boolean;
  onClick?: (file: ArchiveFile) => void;
  onDownload?: (file: ArchiveFile) => void;
  className?: string;
}

export interface FileListRowProps {
  file: ArchiveFile;
  isSelected?: boolean;
  onClick?: (file: ArchiveFile) => void;
  onDownload?: (file: ArchiveFile) => void;
  className?: string;
}

export interface FileGridProps {
  files: ArchiveFile[];
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onFileDownload: (fileId: string) => void;
  className?: string;
}

export interface FileListProps {
  files: ArchiveFile[];
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onFileDownload: (fileId: string) => void;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}

export interface StorageStatsProps {
  stats: StorageStats;
  className?: string;
}

// Utility Types
export interface FileFilterOptions {
  category: FileCategory;
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface FileSizeInfo {
  bytes: number;
  formatted: string;
}

export interface ArchiveFileValidation {
  isValid: boolean;
  errors: string[];
}

// Constants
export const ARCHIVE_CATEGORIES = {
  ALL: "all" as const,
  RECENT: "recent" as const,
  REPORTS: "reports" as const,
  MANUALS: "manuals" as const,
  DOCUMENTS: "documents" as const,
};

export const SORT_FIELDS = {
  NAME: "name" as const,
  DATE: "date" as const,
  SIZE: "size" as const,
};

export const SORT_ORDERS = {
  ASC: "asc" as const,
  DESC: "desc" as const,
};

// Type Guards
export const isArchiveFile = (obj: unknown): obj is ArchiveFile => {
  const file = obj as Record<string, unknown>;
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof file.id === "string" &&
    typeof file.name === "string" &&
    typeof file.size === "string" &&
    typeof file.sourceUrl === "string" &&
    typeof file.downloadDate === "string" &&
    typeof file.type === "string" &&
    typeof file.category === "string" &&
    Array.isArray(file.tags) &&
    typeof file.isDownloaded === "boolean"
  );
};

// Utility Functions
export const parseSize = (sizeStr: string): number => {
  const match = sizeStr.match(/([\d.]+)\s*(MB|KB|GB|B)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  const multiplier =
    unit === "GB"
      ? 1024 * 1024 * 1024
      : unit === "MB"
        ? 1024 * 1024
        : unit === "KB"
          ? 1024
          : 1;

  return value * multiplier;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const categorizeFile = (filename: string): string => {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes("report") || lowerName.includes("annual"))
    return ARCHIVE_CATEGORIES.REPORTS;
  if (lowerName.includes("manual") || lowerName.includes("guide"))
    return ARCHIVE_CATEGORIES.MANUALS;
  return ARCHIVE_CATEGORIES.DOCUMENTS;
};

export const extractTags = (filename: string): string[] => {
  const tags: string[] = [];
  const lowerName = filename.toLowerCase();

  if (lowerName.includes("2024") || lowerName.includes("2025"))
    tags.push("current");
  if (lowerName.includes("report")) tags.push("report");
  if (lowerName.includes("manual")) tags.push("manual");
  if (lowerName.includes("technical")) tags.push("technical");

  return tags;
};

export const calculateStorageStats = (files: ArchiveFile[]): StorageStats => {
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, file) => acc + parseSize(file.size), 0);

  return {
    totalFiles,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    averageSize: totalFiles > 0 ? totalSize / totalFiles : 0,
  };
};

// Factory Functions
export const createArchiveFile = (
  name: string,
  sourceUrl: string,
  size: string = "Unknown",
  type: string = "application/pdf",
): ArchiveFile => ({
  id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name,
  size,
  sourceUrl,
  downloadDate: new Date().toISOString(),
  type,
  category: categorizeFile(name),
  tags: extractTags(name),
  isDownloaded: true,
});

export const createDefaultCategoryInfo = (
  id: string,
  name: string,
  icon: React.ComponentType<{ className?: string }>,
): CategoryInfo => ({
  id,
  name,
  icon,
  count: 0,
});
