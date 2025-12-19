import { useState, useCallback, useMemo } from 'react';
import {
  ArchiveFile,
  CategoryInfo,
  StorageStats,
  calculateStorageStats,
  filterFiles,
  sortFiles,
  updateCategoryCounts,
  formatBytes
} from '@/lib/archive';

interface UseFileManagerOptions {
  initialFiles?: ArchiveFile[];
  categories: CategoryInfo[];
}

export const useFileManager = ({ initialFiles = [], categories }: UseFileManagerOptions) => {
  const [files, setFiles] = useState<ArchiveFile[]>(initialFiles);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Memoized computations
  const storageStats = useMemo((): StorageStats => {
    return calculateStorageStats(files);
  }, [files]);

  const categoryCounts = useMemo((): CategoryInfo[] => {
    return updateCategoryCounts(categories, files);
  }, [categories, files]);

  const filteredFiles = useMemo((): ArchiveFile[] => {
    const filtered = filterFiles(files, selectedCategory, searchQuery);
    return sortFiles(filtered, sortBy, sortOrder);
  }, [files, selectedCategory, searchQuery, sortBy, sortOrder]);

  // File operations
  const addFile = useCallback((file: ArchiveFile) => {
    setFiles(prev => [...prev, file]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setSelectedFiles(prev => {
      const newSelected = new Set(prev);
      newSelected.delete(fileId);
      return newSelected;
    });
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<ArchiveFile>) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId ? { ...file, ...updates } : file
    ));
  }, []);

  const removeSelectedFiles = useCallback(() => {
    setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
    setSelectedFiles(new Set());
  }, [selectedFiles]);

  // Selection operations
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else {
        newSelected.add(fileId);
      }
      return newSelected;
    });
  }, []);

  const selectAllFiles = useCallback(() => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  }, [selectedFiles.size, filteredFiles]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  // Sorting operations
  const handleSort = useCallback((field: 'name' | 'date' | 'size') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy]);

  // Search operations
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Category operations
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return {
    // State
    files,
    selectedFiles,
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,

    // Computed values
    storageStats,
    categoryCounts,
    filteredFiles,

    // File operations
    addFile,
    removeFile,
    updateFile,
    removeSelectedFiles,

    // Selection operations
    toggleFileSelection,
    selectAllFiles,
    clearSelection,

    // Sorting operations
    handleSort,

    // Search operations
    handleSearch,

    // Category operations
    handleCategoryChange,
  };
};
