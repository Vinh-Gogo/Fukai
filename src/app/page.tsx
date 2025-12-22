"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const dynamic = "force-dynamic";

import React, { useState, useCallback, useEffect } from "react";
import dynamicImport from "next/dynamic";
import BrandHeader from "@/components/layout/BrandHeader";
import { Search } from "lucide-react";

// Custom hooks
import {
  useCrawlJobs,
  useCrawlSettings,
  useCrawlOperations,
  useCrawlStats,
  useActivityLogger,
} from "@/hooks";

// Components
import {
  CrawlJobForm,
  CrawlSettingsPanel,
  CrawlJobList,
  CrawlQuickActions,
} from "@/components/crawl";
import { DownloadAppSection } from "@/components/features";
import { NavigationSkeleton } from "@/components/navigation";
import { StorageService, createPDFFile } from "@/lib/crawl";

// Dynamically import Navigation to prevent SSR issues
const Navigation = dynamicImport(
  () =>
    import("@/components/navigation").then((mod) => ({
      default: mod.Navigation,
    })),
  {
    ssr: false,
    loading: () => <NavigationSkeleton />,
  },
);

// Main Component
export default function Home() {
  const { logActivity } = useActivityLogger();
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);

  // Navigation toggle function
  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((prev) => !prev);
  }, []);

  // Custom hooks
  const crawlJobs = useCrawlJobs();
  const crawlSettings = useCrawlSettings();
  const crawlStats = useCrawlStats(crawlJobs.jobs);
  const crawlOperations = useCrawlOperations(crawlJobs.updateJob);

  // Page load logging
  useEffect(() => {
    if (crawlJobs.isLoading) return;

    logActivity("page_load", {
      job_count: crawlStats.stats.totalJobs,
      running_jobs: crawlStats.stats.runningJobs,
      auto_download_enabled: crawlSettings.settings.autoDownloadEnabled,
    });
  }, [
    crawlStats.stats.totalJobs,
    crawlStats.stats.runningJobs,
    crawlSettings.settings.autoDownloadEnabled,
    crawlJobs.isLoading,
    logActivity,
  ]);

  // Event handlers using the new hooks
  const handleStartCrawl = useCallback(
    async (jobId: string) => {
      const job = crawlJobs.getJob(jobId);
      if (!job) return;

      await crawlOperations.startCrawl(jobId, job);

      // Auto-download if enabled
      if (crawlSettings.settings.autoDownloadEnabled && job.pdfUrls?.length) {
        await crawlOperations.handleAutoDownload(jobId, job.pdfUrls);
      }
    },
    [crawlJobs, crawlOperations, crawlSettings.settings.autoDownloadEnabled],
  );

  const handleAutoDownloadChange = useCallback(
    (enabled: boolean) => {
      crawlSettings.updateSettings({ autoDownloadEnabled: enabled });
    },
    [crawlSettings],
  );

  const handleAddToProcessing = useCallback(
    async (pdfUrls: string[]) => {
      if (!pdfUrls || pdfUrls.length === 0) {
        alert("No PDFs found to add to processing");
        return;
      }

      try {
        // Download PDFs using the existing download API
        const data = await crawlOperations.downloadAllPDFs(pdfUrls);

        if (data.success) {
          // Navigate to PDFs page to show the downloaded files
          window.location.href = "/pdfs";
        } else {
          alert(`Failed to download PDFs: ${data.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error adding PDFs to processing:", error);
        alert(
          `Failed to add PDFs to processing: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [crawlOperations],
  );

  const handleDeleteJob = useCallback(
    (jobId: string) => {
      if (window.confirm("Are you sure you want to delete this crawl job?")) {
        crawlJobs.removeJob(jobId);
      }
    },
    [crawlJobs],
  );

  const handleEditJob = useCallback(
    (jobId: string) => {
      const job = crawlJobs.getJob(jobId);
      if (!job) return;

      const newUrl = window.prompt("Edit job URL:", job.url);
      if (newUrl && newUrl.trim() !== job.url) {
        try {
          if (!newUrl.trim()) throw new Error("URL cannot be empty");
          const trimmedUrl = newUrl.trim();
          if (!isValidUrl(trimmedUrl))
            throw new Error("Please enter a valid URL");

          // Check for duplicate URLs
          const existingJob = crawlJobs.jobs.find(
            (j) => j.id !== jobId && j.url === trimmedUrl,
          );
          if (existingJob)
            throw new Error("A job with this URL already exists");

          crawlJobs.updateJob(jobId, { url: trimmedUrl });
        } catch (error) {
          alert(
            error instanceof Error ? error.message : "Failed to update job",
          );
        }
      }
    },
    [crawlJobs],
  );

  // Validate URL format (duplicate from hook for use here)
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Loading state
  if (crawlJobs.isLoading) {
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar - Left side */}
      <Navigation isVisible={isNavigationVisible} onToggle={toggleNavigation} />

      {/* Main Content Area - Right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content - Scrollable area including header */}
        <main className="flex-1 overflow-y-auto rounded-3xl">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon="search"
            title="RAG Platform"
            subtitle="AI-Powered Semantic Search"
            statusText="Ready to search your documents"
          />

          <div className="container mx-auto px-4 py-8">
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

            {/* Add New Job Form */}
            <CrawlJobForm
              onAddJob={crawlJobs.addJob}
              disabled={crawlOperations.isRunning}
            />

            {/* Auto-Download Settings */}
            <CrawlSettingsPanel
              autoDownloadEnabled={crawlSettings.settings.autoDownloadEnabled}
              onAutoDownloadChange={handleAutoDownloadChange}
              disabled={crawlOperations.isRunning}
            />

            {/* Jobs List */}
            <CrawlJobList
              jobs={crawlJobs.jobs}
              isRunning={crawlOperations.isRunning}
              onStart={handleStartCrawl}
              onStop={crawlOperations.stopCrawl}
              onReRun={handleStartCrawl}
              onDelete={handleDeleteJob}
              onEdit={handleEditJob}
              onAddToProcessing={handleAddToProcessing}
              onDownloadSingle={crawlOperations.downloadSinglePDF}
            />

            {/* Quick Actions */}
            <CrawlQuickActions
              jobs={crawlJobs.jobs}
              onDownloadAll={crawlOperations.downloadAllPDFs}
              disabled={crawlOperations.isRunning}
            />

            {/* Download App Section */}
            <section className="mb-12">
              <DownloadAppSection />
            </section>
          </div>
        </main>

        {/* Footer */}
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
