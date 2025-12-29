"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = "edge";
import { RefreshCw, Search, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUploadZone } from "@/components/uploads/FileUploadZone";
import { UploadProgressBar } from "@/components/uploads/UploadProgressBar";
import { useFileUpload, useDownloadedPDFs, useVirtualizedList } from "@/hooks";
import { TableRow } from "@/components/pdf";
import { PDFFile } from "@/components/pdf/types";
import { Navigation } from "@/components/navigation";
import { useNavigationContext } from "@/components/navigation/NavigationContext";
import BrandHeader from "@/components/layout/BrandHeader";
import { PDFList } from "@/components/features/PDFList";
import { useCrawlRealtimeStore } from "@/stores/crawlRealtime";
import { LiveStatusIndicator } from "@/components/ui/LiveStatusIndicator";
import { backendAPI } from "@/lib/api/backend-client";

// Dynamically import PDFViewer with SSR disabled to prevent document access errors
const PDFViewer = dynamic(
  () => import("@/components/pdf/PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 border-b-2 border-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PDF Viewer...</p>
        </div>
      </div>
    ),
  },
);

export default function PDFProcessing() {
  const { addDownloadedPDF } = useDownloadedPDFs();
  const { uploads, uploadFiles, cancelUpload } = useFileUpload();
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const { currentWidth } = useNavigationContext();

  // Prevent hydration mismatch by initializing margin to server-safe value ("0px")
  // and only reading window.innerWidth inside useEffect after mount.
  const [marginLeft, setMarginLeft] = useState<string>("0px");
  useEffect(() => {
    const updateMargin = () => {
      setMarginLeft(window.innerWidth >= 1024 ? `${currentWidth * 4}px` : "0px");
    };
    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, [currentWidth]);

  // Connect to crawl realtime store
  const realtimeStore = useCrawlRealtimeStore();

  // Navigation toggle function
  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((prev) => !prev);
  }, []);

  // Fetch real PDF files from backend
  const fetchRealPDFFiles = useCallback(async (): Promise<PDFFile[]> => {
    try {
      // Import backend client dynamically to avoid SSR issues
      const { backendAPI } = await import("@/lib/api/backend-client");

      // Fetch list of documents from backend
      type BackendDoc = {
        id?: string;
        filename: string;
        size?: number;
        file_size?: number;
        created_at: string;
        status?: string;
        processing_status?: string;
      };
      const data = await backendAPI.listDocuments() as { documents?: BackendDoc[] };
      const documents = data.documents || [];

      // Convert backend document format to PDFFile format
      return documents.map(
        (
          doc: {
            id?: string;
            filename: string;
            size?: number;
            file_size?: number;
            created_at: string;
            status?: string;
            processing_status?: string;
          },
          index: number,
        ) => {
          const fileSize = doc.size || doc.file_size || 0;
          const status = doc.status || doc.processing_status || 'processing';

          return {
            id: doc.id || `doc-${Date.now()}-${index}`,
            name: doc.filename,
            size: fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : "Unknown",
            status: (status === "completed" ? "completed" : "processing") as "completed" | "processing",
            uploadDate: new Date(doc.created_at).toLocaleString(),
            sourceUrl: `/api/documents/${doc.id}/download`, // Backend download endpoint
            pages: Math.floor(Math.random() * 50) + 10, // Mock page count for now
            language: "English", // Default assumption
          };
        },
      );
    } catch (error: unknown) {
      const err = error as { message?: string; type?: string; status?: number };
      console.error("Failed to fetch PDF files:", err);

      // Provide more specific error information
      if (err.type === "network") {
        console.warn("Backend server is not available. Showing demo files.");
      } else if (typeof err.status === "number" && err.status >= 500) {
        console.error("Backend server error:", err.message);
      } else {
        console.error("API error:", err.message ?? String(error));
      }

      // Fallback to demo files if backend is unavailable
      return [];
    }
  }, []);

  // 3. Trong component chính, áp dụng virtualization
  const { visibleItems, startIndex, totalItems, handleScroll, itemHeight } =
    useVirtualizedList(files, 600, 64);

  // Create memoized callbacks
  const fetchPDFFiles = useCallback(async () => {
    try {
      setLoading(true);
      const realFiles = await fetchRealPDFFiles();
      setFiles(realFiles);
    } catch (err) {
      console.error("Failed to load PDF files:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchRealPDFFiles]);

  const handleDownload = useCallback(
    (file: PDFFile) => {
      addDownloadedPDF(file.sourceUrl);
    },
    [addDownloadedPDF],
  );

  const handleDelete = useCallback(
    async (file: PDFFile) => {
      // Confirm deletion
      if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
        return;
      }

      try {
        // For uploaded files, call the delete API
        if (file.sourceUrl.startsWith("/uploaded/")) {
          const response = await fetch(
            `/api/delete?filename=${encodeURIComponent(file.sourceUrl)}`,
            {
              method: "DELETE",
            },
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete file");
          }
        }

        // Remove from the files list
        setFiles((prev) => prev.filter((f) => f.id !== file.id));

        // Close viewer if the deleted file was being viewed
        if (selectedFile?.id === file.id) {
          setSelectedFile(null);
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete file. Please try again.");
      }
    },
    [selectedFile],
  );

  const handleRowClick = useCallback((file: PDFFile) => {
    setSelectedFile(file);
  }, []);

  // Load URLs from data file
  const loadUrlsFromDataFile = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/data/urls');
      if (!response.ok) {
        throw new Error('Failed to load data file');
      }
      const data = await response.json();
      return data.urls || [];
    } catch (error) {
      console.error('Failed to load URLs from data file:', error);
      // Fallback: return empty array
      return [];
    }
  }, []);

  // Handler for adding crawled URLs to processing
  const handleAddCrawledURLsToProcessing = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    try {
      console.log(`Processing ${urls.length} crawled URLs...`);

      // Create initial file entries with "downloading" status
      const initialFiles: PDFFile[] = urls.map((url, index) => ({
        id: `downloading-${Date.now()}-${index}`,
        name: decodeURIComponent(url.split("/").pop() || `crawled-pdf-${index + 1}.pdf`),
        size: "Downloading...",
        status: "processing" as const,
        uploadDate: new Date().toLocaleString(),
        sourceUrl: url,
        pages: 0,
        language: "English",
      }));

      // Add files to the list immediately with downloading status
      setFiles((prev) => [...initialFiles, ...prev]);

      // Send download request to backend via the backend client (ensures correct baseURL and better errors)
      try {
        const result = await backendAPI.downloadPDFs({ pdf_urls: urls });

        // Update UI entries based on result.files (if provided)
        // Map backend result files to PDFFile format
        // Handle per-file results: successful downloads and errors
        type CrawlerFile = {
          filename?: string;
          filepath?: string;
          size?: number;
          url?: string;
          error?: string;
        };
        const completedFiles = (result.files || []).map((f: CrawlerFile, idx: number): PDFFile => {
          const filename =
            (f?.filename ?? (f?.filepath ? f.filepath.split("/").pop() : undefined)) ??
            `downloaded-${Date.now()}-${idx}`;

          // If backend returned an error for this file, mark it as error
          if (f?.error) {
            return {
              id: `error-${Date.now()}-${idx}`,
              name: filename,
              size: "Error",
              status: "error" as const,
              uploadDate: new Date().toISOString().slice(0, 19).replace("T", " "),
              sourceUrl: f?.url || f?.filepath || "",
              pages: 0,
              language: "English",
            };
          }

          const size = f?.size ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : "Unknown";
          const sourceUrl = f?.url || (f?.filepath ? `/uploaded/${filename}` : "");
          return {
            id: `completed-${Date.now()}-${idx}`,
            name: filename,
            size,
            status: "completed" as const,
            uploadDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            sourceUrl,
            pages: Math.floor(Math.random() * 50) + 10,
            language: "English",
          };
        });
 
        // Replace initial placeholder entries with completed ones in order
        setFiles((prev) => {
          const updated = [...prev];
          for (let i = 0; i < initialFiles.length; i++) {
            const placeholderId = initialFiles[i].id;
            const completed = completedFiles[i];
            if (completed) {
              const idx = updated.findIndex((f) => f.id === placeholderId);
              if (idx !== -1) updated[idx] = completed;
              else updated.unshift(completed);
            }
          }
          return updated;
        });

        // If the overall operation reported failure, surface message and mark placeholders
        if (result && result.success === false) {
          console.error("Server reported download failure:", result.error || result.message);
          setFiles((prev) =>
            prev.map((f) => (f.id.startsWith("downloading-") ? { ...f, size: "Error", status: "error" as const } : f)),
          );
          alert(`Download operation failed on server: ${result.error || result.message}`);
        }
 
        console.log(`Successfully requested server-side download for ${urls.length} PDFs`);
      } catch (error) {
        console.error("Failed to request server-side download:", error);
 
        // Mark all initial entries as error
        setFiles((prev) =>
          prev.map((f) => (f.id.startsWith("downloading-") ? { ...f, size: "Error", status: "error" as const } : f)),
        );
 
        alert("Failed to download crawled PDFs via server. See console for details.");
      }

    } catch (error) {
      console.error("Failed to process crawled URLs:", error);
      alert("Failed to process crawled URLs. Please try again.");
    }
  }, []);

  // Handler for downloading individual crawled PDF
  const handleDownloadCrawledPDF = useCallback(async (url: string) => {
    try {
      // Open the URL in a new tab for download
      window.open(url, '_blank');
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchPDFFiles();
  }, [fetchPDFFiles]);

  // Handle file uploads
  const handleFilesSelected = useCallback(
    async (uploadedFiles: File[]) => {
      if (uploadedFiles.length === 0) return;

      // Start upload simulation for progress tracking
      await uploadFiles(uploadedFiles);

      // Upload files to server
      const uploadPromises = uploadedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload failed");
          }

          const result = await response.json();
          return {
            file,
            result,
            success: true,
          };
        } catch (error) {
          console.error("Upload error for file:", file.name, error);
          return {
            file,
            error: error instanceof Error ? error.message : "Upload failed",
            success: false,
          };
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Convert uploaded files to PDFFile objects
      const newPDFFiles: PDFFile[] = uploadResults.map(
        ({ file, result, success }, index) => ({
          id: `uploaded-${Date.now()}-${index}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          status: success ? ("completed" as const) : ("error" as const),
          uploadDate: new Date().toISOString().slice(0, 19).replace("T", " "),
          sourceUrl: success ? result.url : "",
          pages: success ? Math.floor(Math.random() * 50) + 10 : 0, // Mock page count for successful uploads
          language: success ? "English" : "", // Default assumption
        }),
      );

      setFiles((prev) => [...newPDFFiles, ...prev]);
    },
    [uploadFiles],
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar - Left side */}
      <Navigation isVisible={isNavigationVisible} onToggle={toggleNavigation} />

      {/* Main Content Area - Right side */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft,
        }}
      >
        {/* Main Content - Scrollable area including header */}
        <main className="flex-1 overflow-y-auto">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon="file-text"
            title="PDF Processing"
            subtitle="Intelligent Document Analysis & Management"
            statusText="AI-powered PDF processing ready"
          />

          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                      PDF Processing
                    </h1>
                    {/* Live Status Indicator */}
                    <LiveStatusIndicator
                      isConnected={realtimeStore.isConnected}
                      error={realtimeStore.connectionError}
                      discoveredUrls={realtimeStore.discoveredUrls.length}
                    />
                  </div>
                  <p className="text-gray-600">
                    Manage PDF files and convert to markdown
                  </p>
                </div>
                <button
                  onClick={fetchPDFFiles}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", loading && "animate-spin")}
                  />
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* Crawled URLs Section */}
            <div className="mb-6">
              <PDFList
                pdfUrls={[]} // Empty since we're using realtime or data file URLs
                onAddToProcessing={handleAddCrawledURLsToProcessing}
                onDownloadSingle={handleDownloadCrawledPDF}
                showRealtimeUrls={true}
                showDataFileUrls={true}
              />
            </div>

            {/* File Upload Zone */}
            <div className="mb-6">
              <FileUploadZone onFilesSelected={handleFilesSelected} />
            </div>

            {/* Upload Progress Bars */}
            {uploads.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Upload Progress
                </h3>
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

              <div
                className="overflow-hidden"
                style={{ height: "600px" }}
                onScroll={handleScroll}
              >
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            File
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
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
                              <tr
                                style={{
                                  height: `${startIndex * itemHeight}px`,
                                }}
                              >
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
                              <tr
                                style={{
                                  height: `${Math.max(0, totalItems - startIndex - visibleItems.length) * itemHeight}px`,
                                }}
                              >
                                <td colSpan={3} />
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-8 text-center text-gray-500"
                              >
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
                  <PDFViewer
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                  />
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
