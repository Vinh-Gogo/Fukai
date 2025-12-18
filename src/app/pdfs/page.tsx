"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from 'next/dynamic';

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';
import { RefreshCw, Search, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUploadZone } from "@/components/uploads/FileUploadZone";
import { UploadProgressBar } from "@/components/uploads/UploadProgressBar";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useDownloadedPDFs } from "@/hooks/useDownloadedPDFs";
import { useVirtualizedList } from "@/hooks/useVirtualizedList";
import { PageContent, TableRow } from "./components";
import { PDFFile } from "./components/types";
import { Navigation } from "@/components/navigation";
import BrandHeader from "@/components/layout/BrandHeader";

// Dynamically import PDFViewer with SSR disabled to prevent document access errors
const PDFViewer = dynamic(() => import('./components/PDFViewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 border-b-2 border-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading PDF Viewer...</p>
      </div>
    </div>
  )
});

export default function PDFProcessing() {
  const { addDownloadedPDF, isPDFDownloaded } = useDownloadedPDFs();
  const { uploads, uploadFiles, cancelUpload } = useFileUpload();
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  // Navigation toggle function
  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible(prev => !prev);
  }, []);

  // Dữ liệu giả cho PDF
  const getMockPDFFiles = useCallback((): PDFFile[] => [
    {
      id: "demo-1",
      name: "Annual Report 2024.pdf",
      size: "2.4 MB",
      status: "completed" as const,
      uploadDate: "2025-12-18 14:30:00",
      sourceUrl: "/demo-files/annual-report-2024.pdf",
      pages: 45,
      language: "English"
    },
    {
      id: "demo-2",
      name: "Technical Documentation.pdf",
      size: "1.8 MB",
      status: "processing" as const,
      uploadDate: "2025-12-18 14:25:00",
      sourceUrl: "/demo-files/tech-docs.pdf",
      pages: 32,
      language: "English"
    }
  ], []);

  // 3. Trong component chính, áp dụng virtualization
  const { visibleItems, startIndex, totalItems, handleScroll, itemHeight } =
    useVirtualizedList(files, 600, 64);

  // Create memoized callbacks
  const fetchPDFFiles = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockFiles = getMockPDFFiles();
      setFiles(mockFiles);
    } catch (err) {
      console.error('Failed to load PDF files:', err);
    } finally {
      setLoading(false);
    }
  }, [getMockPDFFiles]);

  const handleDownload = useCallback((file: PDFFile) => {
    addDownloadedPDF(file.sourceUrl);
  }, [addDownloadedPDF]);

  const handleDelete = useCallback(async (file: PDFFile) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      // For uploaded files, call the delete API
      if (file.sourceUrl.startsWith('/uploaded/')) {
        const response = await fetch(`/api/delete?filename=${encodeURIComponent(file.sourceUrl)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete file');
        }
      }

      // Remove from the files list
      setFiles(prev => prev.filter(f => f.id !== file.id));

      // Close viewer if the deleted file was being viewed
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
      }

    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file. Please try again.');
    }
  }, [selectedFile]);

  const handleRowClick = useCallback((file: PDFFile) => {
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    fetchPDFFiles();
  }, [fetchPDFFiles]);

  // Handle file uploads
  const handleFilesSelected = useCallback(async (uploadedFiles: File[]) => {
    if (uploadedFiles.length === 0) return;

    // Start upload simulation for progress tracking
    await uploadFiles(uploadedFiles);

    // Upload files to server
    const uploadPromises = uploadedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        return {
          file,
          result,
          success: true
        };
      } catch (error) {
        console.error('Upload error for file:', file.name, error);
        return {
          file,
          error: error instanceof Error ? error.message : 'Upload failed',
          success: false
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    // Convert uploaded files to PDFFile objects
    const newPDFFiles: PDFFile[] = uploadResults.map(({ file, result, success }, index) => ({
      id: `uploaded-${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: success ? "completed" as const : "error" as const,
      uploadDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
      sourceUrl: success ? result.url : '',
      pages: success ? Math.floor(Math.random() * 50) + 10 : 0, // Mock page count for successful uploads
      language: success ? "English" : "" // Default assumption
    }));

    setFiles(prev => [...newPDFFiles, ...prev]);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar - Left side */}
      <Navigation
        isVisible={isNavigationVisible}
        onToggle={toggleNavigation}
      />

      {/* Main Content Area - Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content - Scrollable area including header */}
        <main className="flex-1 overflow-y-auto rounded-3xl">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon={FileText}
            title="PDF Processing"
            subtitle="Document Processing Pipeline"
            statusText="AI Agent Online & Ready"
          />

          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Processing</h1>
                  <p className="text-gray-600">Manage PDF files and convert to markdown</p>
                </div>
                <button
                  onClick={fetchPDFFiles}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="mb-6">
              <FileUploadZone onFilesSelected={handleFilesSelected} />
            </div>

            {/* Upload Progress Bars */}
            {uploads.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Progress</h3>
                {uploads.map((upload) => (
                  <UploadProgressBar
                    key={upload.id}
                    upload={upload}
                    onCancel={cancelUpload}
                  />
                ))}
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search PDFs..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-hidden" style={{ height: '600px' }} onScroll={handleScroll}>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Fixed Table Header */}
                    <table className="w-full flex-shrink-0">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                    </table>

                    {/* Virtualized Table Body */}
                    <div className="flex-1 overflow-hidden">
                      <table className="w-full">
                        <tbody className="bg-white">
                          {totalItems > 0 ? (
                            <>
                              {/* Placeholder cho các items ở trên */}
                              <tr style={{ height: `${startIndex * itemHeight}px` }}>
                                <td colSpan={3} />
                              </tr>

                              {/* Các items visible */}
                              {visibleItems.map((file) => (
                                <TableRow
                                  key={file.id}
                                  file={file}
                                  isSelected={selectedFile?.id === file.id}
                                  onRowClick={() => handleRowClick(file)}
                                  onDownloadClick={() => handleDownload(file)}
                                  onDeleteClick={() => handleDelete(file)}
                                />
                              ))}

                              {/* Placeholder cho các items ở dưới */}
                              <tr style={{ height: `${Math.max(0, totalItems - startIndex - visibleItems.length) * itemHeight}px` }}>
                                <td colSpan={3} />
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                No PDF files found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedFile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-bold text-lg">{selectedFile.name}</h2>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <PDFViewer file={selectedFile} onClose={() => setSelectedFile(null)} />
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer - Now inside scrollable area */}
        <footer className="border-t border-border py-3 px-4">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>
              RAG Platform © {new Date().getFullYear()} - Intelligent Document
              Processing
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
