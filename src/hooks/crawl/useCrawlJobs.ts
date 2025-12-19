import { useState, useCallback, useEffect } from 'react';

export interface CrawlJob {
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

interface UseCrawlJobsResult {
  jobs: CrawlJob[];
  isLoading: boolean;
  addJob: (url: string) => void;
  updateJob: (jobId: string, updates: Partial<CrawlJob>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => CrawlJob | undefined;
  clearJobs: () => void;
}

const STORAGE_KEY = 'crawlJobs';

// Default jobs for first-time users
const getDefaultJobs = (): CrawlJob[] => [
  {
    id: "1",
    url: "https://biwase.com.vn/tin-tuc/ban-tin-biwase",
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
];

// Load jobs from localStorage
const loadJobsFromStorage = (): CrawlJob[] => {
  if (typeof window === "undefined") return getDefaultJobs();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
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
};

// Save jobs to localStorage
const saveJobsToStorage = (jobs: CrawlJob[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error("Failed to save jobs to localStorage:", error);
  }
};

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const useCrawlJobs = (): UseCrawlJobsResult => {
  // Initialize with empty array to avoid hydration mismatch
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage only on client side after mount
  useEffect(() => {
    const loaded = loadJobsFromStorage();
    setJobs(loaded);
    setIsLoading(false);
  }, []);

  // Save jobs whenever they change (skip initial load)
  useEffect(() => {
    if (!isLoading) {
      saveJobsToStorage(jobs);
    }
  }, [jobs, isLoading]);

  const addJob = useCallback((url: string) => {
    if (!url.trim()) return;

    const trimmedUrl = url.trim();
    if (!isValidUrl(trimmedUrl)) {
      throw new Error("Please enter a valid URL starting with http:// or https://");
    }

    // Check for duplicate URLs
    const existingJob = jobs.find(job => job.url === trimmedUrl);
    if (existingJob) {
      throw new Error("A job with this URL already exists");
    }

    const newJob: CrawlJob = {
      id: Date.now().toString(),
      url: trimmedUrl,
      status: "idle",
      progress: 0,
      pagesFound: 0,
      pdfsFound: 0,
      lastRun: "Never",
    };

    setJobs(prev => [...prev, newJob]);
  }, [jobs]);

  const updateJob = useCallback((jobId: string, updates: Partial<CrawlJob>) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getJob = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const clearJobs = useCallback(() => {
    setJobs([]);
  }, []);

  return {
    jobs,
    isLoading,
    addJob,
    updateJob,
    removeJob,
    getJob,
    clearJobs,
  };
};
