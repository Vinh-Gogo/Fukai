"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';

import React, { useState, useCallback } from "react";
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
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Trash2,
  FileText,
  BarChart3,
  Folder,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/hooks/useFileManager";
import { FileGrid, FileList, StorageStats } from "./components";
import { ArchiveFile, CategoryInfo } from "@/lib/archiveUtils";

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
const ARCHIVE_CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'All Files', icon: Archive, count: 0 },
  { id: 'documents', name: 'Documents', icon: FileText, count: 0 },
  { id: 'reports', name: 'Reports', icon: BarChart3, count: 0 },
  { id: 'manuals', name: 'Manuals', icon: Folder, count: 0 },
  { id: 'recent', name: 'Recent', icon: Calendar, count: 0 },
];

export default function ArchivePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Use the custom file manager hook
  const fileManager = useFileManager({
    initialFiles: MOCK_ARCHIVE_FILES,
    categories: ARCHIVE_CATEGORIES
  });

  // Event handlers
  const handleFilePreview = useCallback((file: ArchiveFile) => {
    window.open(file.sourceUrl, '_blank');
  }, []);

  const handleFileDelete = useCallback((fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      fileManager.removeFile(fileId);
    }
  }, [fileManager]);

  const handleBulkDelete = useCallback(() => {
    if (fileManager.selectedFiles.size === 0) return;

    if (confirm(`Delete ${fileManager.selectedFiles.size} selected file(s)?`)) {
      fileManager.removeSelectedFiles();
    }
  }, [fileManager]);

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
            statusText={`${fileManager.storageStats.totalFiles} files • ${fileManager.storageStats.totalSizeFormatted}`}
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
                      value={fileManager.searchQuery}
                      onChange={(e) => fileManager.handleSearch(e.target.value)}
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
                {fileManager.selectedFiles.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {fileManager.selectedFiles.size} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
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
                {fileManager.categoryCounts.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => fileManager.handleCategoryChange(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      fileManager.selectedCategory === category.id
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
              {/* Sidebar - Storage Stats */}
              <div className="w-64 flex-shrink-0">
                <StorageStats stats={fileManager.storageStats} />
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                {/* Sort Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {fileManager.filteredFiles.length} files
                    </span>
                    <button
                      onClick={fileManager.selectAllFiles}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      {fileManager.selectedFiles.size === fileManager.filteredFiles.length ? (
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
                        onClick={() => fileManager.handleSort(field)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors",
                          fileManager.sortBy === field ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                        )}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                        {fileManager.sortBy === field && (
                          fileManager.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Files Display */}
                {viewMode === 'grid' ? (
                  <FileGrid
                    files={fileManager.filteredFiles}
                    selectedFiles={fileManager.selectedFiles}
                    onFileSelect={fileManager.toggleFileSelection}
                    onFilePreview={handleFilePreview}
                    onFileDelete={handleFileDelete}
                  />
                ) : (
                  <FileList
                    files={fileManager.filteredFiles}
                    selectedFiles={fileManager.selectedFiles}
                    onFileSelect={fileManager.toggleFileSelection}
                    onFilePreview={handleFilePreview}
                    onFileDelete={handleFileDelete}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
