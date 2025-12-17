"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Download, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { toast } from "sonner";
import { QuickActionCard } from "@/components/QuickActionCard";
import { JobCard } from "@/components/JobCard";
import { DownloadAppSection } from "@/components/DownloadAppSection";
import BrandHeader from "@/components/BrandHeader";

// TypeScript Interfaces
interface CrawlJob {
  id: string;
  url: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  pagesFound: number;
  pdfsFound: number;
  lastRun: string;
  avgDelay?: number;
  successRate?: number;
  errorMessage?: string;
  pdfUrls?: string[];
  currentStage?: "pages" | "articles" | "pdfs";
  pageUrls?: string[];
  articleUrls?: string[];
}

interface PDFFile {
  id: string;
  name: string;
  size: string;
  status: "pending" | "processing" | "completed" | "error";
  uploadDate: string;
  sourceUrl: string;
  markdownUrl?: string;
  pages: number;
  language: string;
  quality: "high" | "medium" | "low";
}

// Main Component
export default function Home() {
  const { logActivity, logError } = useActivityLogger();

  // Default jobs for first-time users
  const getDefaultJobs = useCallback((): CrawlJob[] => [
    {
      id: "1",
      url: "https://biwase.com.vn/tin-tuc/ban-tunc-biwase",
      status: "completed",
      progress: 100,
      pagesFound: 9,
      pdfsFound: 24,
      lastRun: "2025-12-13 20:30:00",
      avgDelay: 3.2,
      successRate: 95,
      pdfUrls: [
        "https://biwase.com.vn/uploads/ban-tin/Ban-tin-thang-10-2025.pdf",
        "https://biwase.com.vn/uploads/ban-tin/Ban-tin-thang-9-2025.pdf",
        "https://biwase.com.vn/uploads/ban-tin/Ban-tin-thang-8-2025.pdf",
        "https://biwase.com.vn/uploads/ban-tin/Ban-tin-thang-7-2025.pdf",
        "https://biwase.com.vn/uploads/ban-tin/Ban-tin-thang-6-2025.pdf",
      ],
    },
  ], []);

  // Storage management functions
  const loadJobsFromStorage = useCallback((): CrawlJob[] => {
    if (typeof window === "undefined") return getDefaultJobs();

    try {
      const saved = localStorage.getItem("crawlJobs");
      if (!saved) return getDefaultJobs();

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        console.warn("Invalid jobs data in localStorage, using defaults");
        return getDefaultJobs();
      }

      return parsed.map((job: Partial<CrawlJob>) => ({
        id: job.id || Date.now().toString(),
        url: job.url || "",
        status: job.status || "idle",
        progress: job.progress || 0,
        pagesFound: job.pagesFound || 0,
        pdfsFound: job.pdfsFound || 0,
        lastRun: job.lastRun || "Never",
        avgDelay: job.avgDelay,
        successRate: job.successRate,
        errorMessage: job.errorMessage,
        pdfUrls: job.pdfUrls,
        currentStage: job.currentStage,
        pageUrls: job.pageUrls,
        articleUrls: job.articleUrls,
      }));
    } catch (error) {
      console.error("Failed to load jobs from localStorage:", error);
      return getDefaultJobs();
    }
  }, [getDefaultJobs]);

  const saveJobsToStorage = useCallback((jobsToSave: CrawlJob[]) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("crawlJobs", JSON.stringify(jobsToSave));
    } catch (error) {
      console.error("Failed to save jobs to localStorage:", error);
    }
  }, []);

  const loadSettingsFromStorage = useCallback(() => {
    if (typeof window === "undefined") return { autoDownloadEnabled: true };

    try {
      const saved = localStorage.getItem("crawlSettings");
      if (!saved) return { autoDownloadEnabled: true };

      const parsed = JSON.parse(saved);
      return {
        autoDownloadEnabled:
          parsed.autoDownloadEnabled !== undefined
            ? parsed.autoDownloadEnabled
            : true,
      };
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      return { autoDownloadEnabled: true };
    }
  }, []);

  const saveSettingsToStorage = useCallback(
    (settings: { autoDownloadEnabled: boolean }) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem("crawlSettings", JSON.stringify(settings));
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error);
      }
    },
    []
  );

  // State management
  const [isRunning, setIsRunning] = useState(false);
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(
    () => loadSettingsFromStorage().autoDownloadEnabled
  );
  const [jobs, setJobs] = useState<CrawlJob[]>(getDefaultJobs());
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Effects
  useEffect(() => {
    const savedJobs = loadJobsFromStorage();
    setJobs(savedJobs);
    setIsLoading(false);
  }, [loadJobsFromStorage]);

  useEffect(() => {
    if (isLoading) return;

    logActivity("page_load", {
      job_count: jobs.length,
      running_jobs: jobs.filter((j) => j.status === "running").length,
      auto_download_enabled: autoDownloadEnabled,
    });
  }, [jobs.length, autoDownloadEnabled, logActivity, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    saveJobsToStorage(jobs);
  }, [jobs, saveJobsToStorage, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    saveSettingsToStorage({ autoDownloadEnabled });
  }, [autoDownloadEnabled, saveSettingsToStorage, isLoading]);



  // Core functionality
  const startCrawl = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || isRunning) return;

    const crawlStartTime = Date.now();
    logActivity("crawl_started", {
      job_id: jobId,
      job_url: job.url,
      auto_download_enabled: autoDownloadEnabled,
    });

    // Update job status to running
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "running",
              progress: 0,
              errorMessage: undefined,
              currentStage: "pages",
            }
          : j
      )
    );
    setIsRunning(true);

    try {
      // Stage 1: Get pagination links
      logActivity("crawl_stage_started", {
        job_id: jobId,
        stage: "pages",
        url: job.url,
      });

      const pagesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/crawl/pages?url=${encodeURIComponent(job.url)}`
      );

      if (!pagesResponse.ok) {
        throw new Error(`HTTP error! status: ${pagesResponse.status}`);
      }

      const pagesData = await pagesResponse.json();
      if (!pagesData.success) {
        throw new Error(pagesData.message || "Failed to get pages");
      }

      // Update UI with pages found
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                pagesFound: pagesData.pages_found,
                pageUrls: pagesData.page_urls,
                progress: 10,
                currentStage: "articles",
              }
            : j
        )
      );

      logActivity("pages_discovered", {
        job_id: jobId,
        pages_found: pagesData.pages_found,
        page_urls: pagesData.page_urls,
      });

      // Stage 2: Get articles from pages
      logActivity("crawl_stage_started", {
        job_id: jobId,
        stage: "articles",
        pages_found: pagesData.pages_found,
      });

      const articlesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/crawl/articles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_urls: pagesData.page_urls }),
        }
      );

      if (!articlesResponse.ok) {
        throw new Error(`HTTP error! status: ${articlesResponse.status}`);
      }

      const articlesData = await articlesResponse.json();
      if (!articlesData.success) {
        throw new Error(articlesData.message || "Failed to get articles");
      }

      // Update UI with articles found
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                articleUrls: articlesData.article_urls,
                progress: 50,
                currentStage: "pdfs",
              }
            : j
        )
      );

      logActivity("articles_discovered", {
        job_id: jobId,
        articles_found: articlesData.article_urls?.length || 0,
        pages_processed: pagesData.pages_found,
      });

      // Stage 3: Extract PDF links from articles
      logActivity("crawl_stage_started", {
        job_id: jobId,
        stage: "pdfs",
        articles_found: articlesData.article_urls?.length || 0,
      });

      const pdfsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/crawl/pdf-links`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_urls: articlesData.article_urls }),
        }
      );

      if (!pdfsResponse.ok) {
        throw new Error(`HTTP error! status: ${pdfsResponse.status}`);
      }

      const pdfsData = await pdfsResponse.json();
      if (!pdfsData.success) {
        throw new Error(pdfsData.message || "Failed to get PDF links");
      }

      logActivity("pdfs_discovered", {
        job_id: jobId,
        pdfs_found: pdfsData.pdfs_found,
        articles_processed: articlesData.article_urls?.length || 0,
      });

      // Update job with final results
      const avgDelay = 3.2;
      const successRate = pdfsData.pdfs_found > 0 ? 95 : 0;

      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "completed",
                progress: 100,
                pdfsFound: pdfsData.pdfs_found,
                lastRun: new Date().toLocaleString(),
                avgDelay,
                successRate,
                pdfUrls: pdfsData.pdf_urls,
                currentStage: undefined,
              }
            : j
        )
      );

      logActivity("crawl_completed", {
        job_id: jobId,
        total_pages: pagesData.pages_found,
        total_articles: articlesData.article_urls?.length || 0,
        total_pdfs: pdfsData.pdfs_found,
        success_rate: successRate,
        avg_delay: avgDelay,
        duration_ms: Date.now() - crawlStartTime,
      });

      // Auto-download new PDFs if enabled
      if (autoDownloadEnabled && pdfsData.pdf_urls?.length > 0) {
        await handleAutoDownload(jobId, pdfsData.pdf_urls);
      }
    } catch (error) {
      handleCrawlError(error, jobId, job?.url, crawlStartTime);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoDownload = async (jobId: string, pdfUrls: string[]) => {
    try {
      const existingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdfs/existing`
      );

      if (!existingResponse.ok) {
        throw new Error(`HTTP error! status: ${existingResponse.status}`);
      }

      const existingData = await existingResponse.json();
      const existingFiles = existingData.existing_files || [];

      const newPdfUrls = pdfUrls.filter((url: string) => {
        const filename = url.split("/").pop();
        return filename && !existingFiles.includes(filename);
      });

      if (newPdfUrls.length > 0) {
        logActivity("auto_download_started", {
          job_id: jobId,
          new_pdfs_count: newPdfUrls.length,
        });

        const downloadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/download-pdfs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdf_urls: newPdfUrls }),
          }
        );

        const downloadData = await downloadResponse.json();
        if (downloadData.success) {
          logActivity("auto_download_completed", {
            job_id: jobId,
            downloaded_count: downloadData.downloaded_count,
            total_urls: downloadData.total_urls,
          });
        }
      }
    } catch (error) {
      logError(
        "auto_download_failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          job_id: jobId,
        }
      );
    }
  };

  const handleCrawlError = (
    error: unknown,
    jobId: string,
    jobUrl?: string,
    startTime?: number
  ) => {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred during crawl";

    logError(
      "crawl_failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        job_id: jobId,
        job_url: jobUrl,
        duration_ms: startTime ? Date.now() - startTime : undefined,
      }
    );

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "error",
              progress: 0,
              errorMessage: `Failed to crawl: ${errorMessage}`,
            }
          : j
      )
    );
  };

  const stopCrawl = (jobId: string) => {
    logActivity("crawl_stopped", { job_id: jobId });
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "idle", progress: 0 } : job
      )
    );
    setIsRunning(false);
  };

  const addJob = () => {
    if (!newUrl.trim()) return;

    const url = newUrl.trim();
    if (!url.startsWith("http")) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    logActivity("job_added", {
      job_url: url,
      total_jobs_before: jobs.length,
    });

    const newJob: CrawlJob = {
      id: Date.now().toString(),
      url,
      status: "idle",
      progress: 0,
      pagesFound: 0,
      pdfsFound: 0,
      lastRun: "Never",
    };

    setJobs((prev) => [...prev, newJob]);
    setNewUrl("");
  };

  const addToPDFProcessing = (pdfUrls: string[]) => {
    logActivity("pdfs_added_to_processing", {
      pdf_count: pdfUrls.length,
      pdf_urls: pdfUrls,
    });

    const newFiles: PDFFile[] = pdfUrls.map((url, index) => ({
      id: `crawled-${Date.now()}-${index}`,
      name: decodeURIComponent(url.split("/").pop() || "Unknown.pdf"),
      size: "Unknown",
      status: "pending",
      uploadDate: new Date().toLocaleString(),
      sourceUrl: url,
      pages: 0,
      language: "Vietnamese",
      quality: "medium",
    }));

    localStorage.setItem("pendingPDFs", JSON.stringify(newFiles));
    toast.success(`Added ${newFiles.length} PDFs to processing queue`);
  };

  const downloadSinglePDF = async (pdfUrl: string) => {
    const startTime = Date.now();
    logActivity("single_pdf_download_started", {
      pdf_url: pdfUrl,
      filename: pdfUrl.split("/").pop(),
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/download-pdfs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_urls: [pdfUrl] }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        logActivity("single_pdf_download_completed", {
          pdf_url: pdfUrl,
          filename: pdfUrl.split("/").pop(),
          duration_ms: Date.now() - startTime,
          success: true,
        });
        toast.success(`Downloaded ${pdfUrl.split("/").pop()} successfully!`);
      } else {
        throw new Error(data.message || "Download failed");
      }
    } catch (error) {
      logError(
        "single_pdf_download_failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          pdf_url: pdfUrl,
          duration_ms: Date.now() - startTime,
        }
      );
      toast.error(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const downloadAllPDFs = async (pdfUrls: string[]) => {
    if (!pdfUrls?.length) {
      alert("No PDFs found to download");
      return;
    }

    const startTime = Date.now();
    logActivity("bulk_download_started", {
      pdf_count: pdfUrls.length,
      pdf_urls: pdfUrls,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/download-pdfs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_urls: pdfUrls }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        logActivity("bulk_download_completed", {
          pdf_count: pdfUrls.length,
          downloaded_count: data.downloaded_count,
          duration_ms: Date.now() - startTime,
          success: true,
          output_dir: data.output_dir,
        });

        toast.success(
          `Bulk download completed!\n\nDownloaded: ${data.downloaded_count}/${data.total_urls} PDFs`
        );

        // Update job status
        setJobs((prev) =>
          prev.map((job) =>
            job.pdfUrls?.length
              ? { ...job, lastRun: new Date().toLocaleString() }
              : job
          )
        );
      } else {
        throw new Error(data.message || "Bulk download failed");
      }
    } catch (error) {
      logError(
        "bulk_download_failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          pdf_count: pdfUrls.length,
          duration_ms: Date.now() - startTime,
        }
      );
      toast.error(
        `Error during bulk download: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading crawl jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Brand Header - Fixed at top */}
      <BrandHeader
        icon={Search}
        title="RAG Platform"
        subtitle="Web Search & AI"
        statusText="AI Agent Online & Ready"
      />

      {/* Main Content - Let root layout handle scrolling */}
      <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <section className="mb-8">
            <div className="border-t border-border pt-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Crawl Control
              </h2>
              <p className="text-muted-foreground">
                Manage web scraping jobs and monitor progress
              </p>
            </div>
          </section>

          {/* Add New Job */}
          <section className="mb-8 animate-fade-in">
            <div className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Add New Crawl Job
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  onKeyPress={(e) => e.key === "Enter" && addJob()}
                />
                <button
                  onClick={addJob}
                  disabled={!newUrl.trim()}
                  className={cn(
                    "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2",
                    !newUrl.trim() && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Job</span>
                </button>
              </div>
            </div>
          </section>

          {/* Auto-Download Settings */}
          <section className="mb-8 animate-fade-in">
            <div className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Auto-Download Settings
              </h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="flex items-center cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    checked={autoDownloadEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setAutoDownloadEnabled(newValue);
                      logActivity("auto_download_setting_changed", {
                        enabled: newValue,
                        previous_setting: autoDownloadEnabled,
                      });
                    }}
                    className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary/20 focus:ring-2"
                  />
                  <span className="font-medium text-foreground">
                    Auto-download new PDFs after re-run
                  </span>
                </label>
                <p className="text-sm text-muted-foreground max-w-md">
                  When enabled, re-running a crawl will automatically download
                  any newly discovered PDFs that are not already in storage.
                </p>
              </div>
            </div>
          </section>

          {/* Jobs List */}
          <section className="space-y-6 mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground">
                Active Jobs
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({jobs.length})
                </span>
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isRunning
                      ? "bg-success animate-pulse"
                      : "bg-muted-foreground"
                  )}
                />
                <span className="font-medium">
                  {isRunning ? "Running" : "Idle"}
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isRunning={isRunning}
                  onStart={startCrawl}
                  onStop={stopCrawl}
                  onReRun={startCrawl}
                  onAddToProcessing={addToPDFProcessing}
                  onDownloadSingle={downloadSinglePDF}
                />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-12 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                icon={RefreshCw}
                title="Rescan Biwase"
                description="Check for new newsletters"
                onClick={() => {
                  logActivity("quick_action_rescan", {
                    action: "rescan_biwase",
                    current_job_count: jobs.length,
                  });
                  toast.info("Rescan functionality coming soon!");
                }}
              />
              <QuickActionCard
                icon={Download}
                title="Download All PDFs"
                description="Export found PDF files"
                onClick={() => {
                  const currentJob = jobs.find((job) => job.pdfUrls?.length);
                  if (currentJob?.pdfUrls?.length) {
                    downloadAllPDFs(currentJob.pdfUrls || []);
                  } else {
                    toast.warning("No PDFs found. Please run a crawl first.");
                  }
                }}
              />
              <QuickActionCard
                icon={Settings}
                title="Crawl Settings"
                description="Configure rate limiting"
                onClick={() => {
                  logActivity("quick_action_settings", {
                    action: "crawl_settings_opened",
                  });
                  toast.info("Settings functionality coming soon!");
                }}
              />
            </div>
          </section>

          {/* Download App Section - Inspired by Qwen Chat */}
          <section className="mb-12">
            <DownloadAppSection />
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-6 px-4">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>
              RAG Platform © {new Date().getFullYear()} - Intelligent Document
              Processing
            </p>
          </div>
        </footer>
      </div>
    );
  }
