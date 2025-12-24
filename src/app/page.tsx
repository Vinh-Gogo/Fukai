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
import { useNavigationContext } from "@/components/navigation/NavigationContext";
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
  const [jobFilter, setJobFilter] = useState("all");
  const { currentWidth } = useNavigationContext();

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

  // Computed filtered jobs
  const filteredJobs = crawlJobs.jobs.filter((job) => {
    if (jobFilter === "all") return true;
    if (jobFilter === "running") return job.status === "running";
    if (jobFilter === "completed") return job.status === "completed";
    if (jobFilter === "failed") return job.status === "error";
    return true;
  });

  // Additional handlers for upgraded UI
  const handleSystemStatus = useCallback(() => {
    // Placeholder for system status toggle
    console.log("System status toggled");
  }, []);

  const handleRefreshJobs = useCallback(() => {
    // Placeholder for refreshing jobs - could trigger a re-fetch
    console.log("Refreshing jobs");
    // For now, just log. In a real implementation, this might refetch data
  }, []);

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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar - Left side */}
      <Navigation isVisible={isNavigationVisible} onToggle={toggleNavigation} />

      {/* Main Content Area - Right side - improved mobile responsiveness */}
      <div
        className="flex-1 flex flex-col overflow-hidden min-h-screen transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${currentWidth * 4}px` : '0px'
        }}
      >
        {/* Main Content - Scrollable area including header */}
        <main className="flex-1 overflow-y-auto mx-2">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon="search"
            title="RAG Document Crawler"
            subtitle="AI-Powered Semantic Search"
            statusText="Ready to search your documents"
          />
 
          {/* UPGRADE */}

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
            {/* Vibrant Page Header with Gradient Background */}
            <section className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 backdrop-blur-sm">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIeiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] opacity-5" />

              <div className="relative px-8 py-6 md:py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 mb-3">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                      <span className="text-sm font-medium text-black-300">
                        Active Crawling System
                      </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-2 transition-all duration-300 hover:scale-[1.02]">
                      Web Crawler Control Center
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                      Manage your web scraping jobs with real-time monitoring,
                      intelligent scheduling, and seamless PDF generation.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {crawlOperations.isRunning ? (
                      <div className="flex items-center space-x-2 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-medium text-red-400">
                          Crawling Active
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                        <span className="font-medium text-green-800">
                          System Ready
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleSystemStatus}
                      className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 transform hover:scale-110"
                      title="System Status"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Animated Statistics Preview */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/30 hover:scale-[1.02]">
                    <div className="text-sm text-black-300 mb-1">
                      Total Jobs
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {crawlJobs.jobs.length}
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/30 hover:scale-[1.02]">
                    <div className="text-sm text-black-300 mb-1">
                      Active Crawls
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {
                        crawlJobs.jobs.filter((job) => job.status === "running")
                          .length
                      }
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-blue-500/10 transition-all duration-300 hover:border-blue-500/30 hover:scale-[1.02]">
                    <div className="text-sm text-black-300 mb-1">
                      Completed Jobs
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {
                        crawlJobs.jobs.filter(
                          (job) => job.status === "completed",
                        ).length
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Wave Border Effect */}
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" />
            </section>

            {/* Interactive Add New Job Card with Glassmorphism */}
            <div className="mb-10 animate-fade-in-up">
              <CrawlJobForm
                onAddJob={crawlJobs.addJob}
                disabled={crawlOperations.isRunning}
              />
            </div>

            {/* Settings Panel with Accordion Effect */}
            <div className="mb-10 animate-fade-in-up delay-100">
              <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl">
                <CrawlSettingsPanel
                  autoDownloadEnabled={
                    crawlSettings.settings.autoDownloadEnabled
                  }
                  onAutoDownloadChange={handleAutoDownloadChange}
                  disabled={crawlOperations.isRunning}
                />
              </div>
            </div>

            {/* Jobs List with Enhanced Visuals */}
            <div className="mb-12 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Active Jobs
                </h2>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefreshJobs}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-300 transform hover:rotate-180"
                    title="Refresh Jobs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 animate-spin-slow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>

                  <div className="relative">
                    <select
                      value={jobFilter}
                      onChange={(e) => setJobFilter(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    >
                      <option value="all">All Jobs</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="bg-white/5 backdrop-blur-sm border-2 border-dashed border-blue-500/30 rounded-2xl p-12 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-blue-400/50 mb-4 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <h3 className="text-xl font-medium text-white mb-2">
                      No jobs found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first web crawling job to get started
                    </p>
                    <button
                      onClick={() =>
                        document
                          .getElementById("new-job-form")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30"
                    >
                      Add New Job
                    </button>
                  </div>
                ) : (
                  <CrawlJobList
                    jobs={filteredJobs}
                    isRunning={crawlOperations.isRunning}
                    onStart={handleStartCrawl}
                    onStop={crawlOperations.stopCrawl}
                    onReRun={handleStartCrawl}
                    onDelete={handleDeleteJob}
                    onEdit={handleEditJob}
                    onAddToProcessing={handleAddToProcessing}
                    onDownloadSingle={crawlOperations.downloadSinglePDF}
                  />
                )}
              </div>
            </div>

            {/* Quick Actions with Floating Card Effect */}
            <div className="mb-12 animate-fade-in-up delay-300">
              <CrawlQuickActions
                jobs={crawlJobs.jobs}
                onDownloadAll={crawlOperations.downloadAllPDFs}
                disabled={crawlOperations.isRunning}
              />
            </div>

            {/* Download App Section with Enhanced Design */}
            <section className="mb-16 animate-fade-in-up delay-400">
              <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 rounded-2xl overflow-hidden backdrop-blur-sm border border-violet-500/20">
                <DownloadAppSection />
              </div>
            </section>

            {/* Floating Action Button - improved mobile positioning */}
            {!crawlOperations.isRunning && (
              <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50 animate-bounce">
                <button
                  onClick={() =>
                    document
                      .getElementById("new-job-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 transform hover:rotate-12 touch-manipulation"
                  title="Add New Job"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>
            )}
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
