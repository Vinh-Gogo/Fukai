// Utility functions for archive file management
import type { ArchiveFile, CategoryInfo, StorageStats } from "@/types/archive";

// Re-export types for backwards compatibility
export type { ArchiveFile, CategoryInfo, StorageStats } from "@/types/archive";

/**
 * Parse file size string to bytes
 */
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

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Format date string to localized date
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Categorize file based on name patterns
 */
export const categorizeFile = (filename: string): string => {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes("report") || lowerName.includes("annual"))
    return "reports";
  if (lowerName.includes("manual") || lowerName.includes("guide"))
    return "manuals";
  return "documents";
};

/**
 * Extract tags from filename
 */
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

/**
 * Calculate storage statistics
 */
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

/**
 * Filter files based on category and search query
 */
export const filterFiles = (
  files: ArchiveFile[],
  category: string,
  searchQuery: string,
): ArchiveFile[] => {
  let filtered = files;

  // Category filter
  if (category !== "all") {
    if (category === "recent") {
      // Show files from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(
        (file) => new Date(file.downloadDate) > sevenDaysAgo,
      );
    } else {
      filtered = filtered.filter((file) => file.category === category);
    }
  }

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        file.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  return filtered;
};

/**
 * Sort files by field and order
 */
export const sortFiles = (
  files: ArchiveFile[],
  sortBy: "name" | "date" | "size",
  sortOrder: "asc" | "desc",
): ArchiveFile[] => {
  return [...files].sort((a, b) => {
    let aValue: string | number | Date, bValue: string | number | Date;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "date":
        aValue = new Date(a.downloadDate);
        bValue = new Date(b.downloadDate);
        break;
      case "size":
        aValue = parseSize(a.size);
        bValue = parseSize(b.size);
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
};

/**
 * Update category counts based on files
 */
export const updateCategoryCounts = (
  categories: CategoryInfo[],
  files: ArchiveFile[],
): CategoryInfo[] => {
  const counts = categories.map((cat) => ({ ...cat, count: 0 }));

  files.forEach((file) => {
    const index = counts.findIndex((c) => c.id === file.category);
    if (index !== -1) counts[index].count++;
  });

  // Recent files (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentIndex = counts.findIndex((c) => c.id === "recent");
  if (recentIndex !== -1) {
    counts[recentIndex].count = files.filter(
      (file) => new Date(file.downloadDate) > sevenDaysAgo,
    ).length;
  }

  // All files
  const allIndex = counts.findIndex((c) => c.id === "all");
  if (allIndex !== -1) {
    counts[allIndex].count = files.length;
  }

  return counts;
};
