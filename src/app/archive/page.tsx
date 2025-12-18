"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';

import React, { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import BrandHeader from "@/components/layout/BrandHeader";

// Dynamically import Navigation to prevent SSR issues
const Navigation = dynamic(() => import('@/components/navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => (
    <div className="w-64 bg-gray-100 animate-pulse">
      <div className="h-16 bg-gray-200 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});
import {
  Archive,
  Search,
  Grid,
  List,
  Download,
  Eye,
  Trash2,
  Folder,
  FileText,
  HardDrive,
  BarChart3,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveFile {
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

// Mock archived files data - in a real app, this would come from a database
const MOCK_ARCHIVE_FILES: ArchiveFile[] = [
  {
    id: "archive-1",
    name: "Annual Report 2024.pdf",
    size: "2.4 MB",
    sourceUrl: "/demo-files/annual-report-2024.pdf",
    downloadDate: "2025-12-15",
    type: "PDF",
    category: "reports",
    tags: ["report", "annual", "2024"],
    isDownloaded: true
  },
  {
    id: "archive-2",
    name: "Technical Documentation.pdf",
    size: "1.8 MB",
    sourceUrl: "/demo-files/tech-docs.pdf",
    downloadDate: "2025-12-14",
    type: "PDF",
    category: "manuals",
    tags: ["technical", "manual"],
    isDownloaded: true
  },
  {
    id: "archive-3",
    name: "User Guide.pdf",
    size: "3.2 MB",
    sourceUrl: "/uploaded/user-guide.pdf",
    downloadDate: "2025-12-13",
    type: "PDF",
    category: "manuals",
    tags: ["guide", "user"],
    isDownloaded: false
  },
  {
    id: "archive-4",
    name: "Financial Summary 2024.pdf",
    size: "1.5 MB",
    sourceUrl: "/uploaded/financial-summary.pdf",
    downloadDate: "2025-12-12",
    type: "PDF",
    category: "reports",
    tags: ["financial", "summary", "2024"],
    isDownloaded: false
  }
];

// Archive categories for organization
const ARCHIVE_CATEGORIES = [
  { id: 'all', name: 'All Files', icon: Archive, count: 0 },
  { id: 'documents', name: 'Documents', icon: FileText, count: 0 },
  { id: 'reports', name: 'Reports', icon: BarChart3, count: 0 },
  { id: 'manuals', name: 'Manuals', icon: Folder, count: 0 },
  { id: 'recent', name: 'Recent', icon: Calendar, count: 0 },
];

export default function ArchivePage() {
  const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>(MOCK_ARCHIVE_FILES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Helper functions (defined before useMemo to avoid initialization errors)
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseSize = (sizeStr: string): number => {
    const match = sizeStr.match(/([\d.]+)\s*(MB|KB|GB)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      const multiplier = unit === 'GB' ? 1024 * 1024 * 1024 :
                        unit === 'MB' ? 1024 * 1024 :
                        unit === 'KB' ? 1024 : 1;
      return value * multiplier;
    }
    return 0;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Categorize files based on name patterns
  const categorizeFile = useCallback((filename: string): string => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('report') || lowerName.includes('annual')) return 'reports';
    if (lowerName.includes('manual') || lowerName.includes('guide')) return 'manuals';
    return 'documents';
  }, []);

  // Extract tags from filename
  const extractTags = useCallback((filename: string): string[] => {
    const tags: string[] = [];
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('2024') || lowerName.includes('2025')) tags.push('current');
    if (lowerName.includes('report')) tags.push('report');
    if (lowerName.includes('manual')) tags.push('manual');
    if (lowerName.includes('technical')) tags.push('technical');

    return tags;
  }, []);

  // Calculate storage usage
  const storageStats = useMemo(() => {
    const totalFiles = archiveFiles.length;
    const totalSize = archiveFiles.reduce((acc, file) => {
      const sizeMatch = file.size.match(/([\d.]+)\s*(MB|KB|GB)/);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2];
        const bytes = unit === 'GB' ? value * 1024 * 1024 * 1024 :
                    unit === 'MB' ? value * 1024 * 1024 :
                    unit === 'KB' ? value * 1024 : value;
        return acc + bytes;
      }
      return acc;
    }, 0);

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      averageSize: totalFiles > 0 ? totalSize / totalFiles : 0
    };
  }, [archiveFiles]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let filtered = archiveFiles;

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'recent') {
        // Show files from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(file =>
          new Date(file.downloadDate) > sevenDaysAgo
        );
      } else {
        filtered = filtered.filter(file => file.category === selectedCategory);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.downloadDate);
          bValue = new Date(b.downloadDate);
          break;
        case 'size':
          aValue = parseSize(a.size);
          bValue = parseSize(b.size);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [archiveFiles, selectedCategory, searchQuery, sortBy, sortOrder]);

  // Update category counts
  const categoryCounts = useMemo(() => {
    const counts = ARCHIVE_CATEGORIES.map(cat => ({ ...cat })); // Clone array

    archiveFiles.forEach(file => {
      const index = counts.findIndex(c => c.id === file.category);
      if (index !== -1) counts[index].count++;
    });

    // Recent files (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentIndex = counts.findIndex(c => c.id === 'recent');
    if (recentIndex !== -1) {
      counts[recentIndex].count = archiveFiles.filter(file =>
        new Date(file.downloadDate) > sevenDaysAgo
      ).length;
    }

    // All files
    const allIndex = counts.findIndex(c => c.id === 'all');
    if (allIndex !== -1) {
      counts[allIndex].count = archiveFiles.length;
    }

    return counts;
  }, [archiveFiles]);



  // Event handlers
  const handleFileSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) return;

    if (confirm(`Delete ${selectedFiles.size} selected file(s)?`)) {
      setArchiveFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      setArchiveFiles(prev => prev.filter(file => file.id !== fileId));
    }
  };

  const handleSort = (field: 'name' | 'date' | 'size') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Navigation isVisible={true} onToggle={() => {}} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content - Scrollable area including header */}
        <main className="flex-1 overflow-y-auto rounded-3xl">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon={Archive}
            title="Archive"
            subtitle="File Management & Storage Optimization"
            statusText={`${storageStats.totalFiles} files • ${storageStats.totalSizeFormatted}`}
          />

          <div className="container mx-auto px-4 py-6">
            {/* Search and Controls */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  {/* Search */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      )}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedFiles.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedFiles.size} selected
                    </span>
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {categoryCounts.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              {/* Sidebar - Storage Info */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Storage Overview
                  </h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Files</span>
                      <span className="font-medium">{storageStats.totalFiles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Size</span>
                      <span className="font-medium">{storageStats.totalSizeFormatted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Size</span>
                      <span className="font-medium">{formatBytes(storageStats.averageSize)}</span>
                    </div>
                  </div>

                  {/* Storage Optimization Tips */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Optimization Tips</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Archive old files to reduce storage</li>
                      <li>• Use compression for large documents</li>
                      <li>• Remove duplicate files regularly</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                {/* Sort Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {filteredFiles.length} files
                    </span>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      {selectedFiles.size === filteredFiles.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Select All
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    {(['name', 'date', 'size'] as const).map((field) => (
                      <button
                        key={field}
                        onClick={() => handleSort(field)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors",
                          sortBy === field ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        )}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                        {sortBy === field && (
                          sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Files Display */}
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                    <p className="text-gray-600">
                      {searchQuery || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Download some PDFs to see them here'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow",
                          selectedFiles.has(file.id) && "ring-2 ring-blue-500"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                            className="mt-1"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => window.open(file.sourceUrl, '_blank')}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {file.name}
                            </h4>
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(file.downloadDate)}</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {file.type}
                          </span>
                        </div>

                        {file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {file.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedFiles.size === filteredFiles.length}
                              onChange={handleSelectAll}
                              className="rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedFiles.has(file.id)}
                                onChange={() => handleFileSelect(file.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <span className="font-medium text-gray-900 truncate max-w-xs">
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{file.size}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.downloadDate)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {file.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{file.tags.length - 2} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => window.open(file.sourceUrl, '_blank')}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
