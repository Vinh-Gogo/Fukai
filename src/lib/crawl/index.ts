// Crawl service for API abstraction and business logic
import type {
  CrawlJob,
  CrawlAPIResponse,
  DownloadAPIResponse,
  ExistingPDFResponse,
} from "@/types/crawl";
import type { PDFFile } from "@/types/pdf";

// Re-export types for backwards compatibility
export type {
  CrawlJob,
  CrawlAPIResponse,
  DownloadAPIResponse,
  ExistingPDFResponse,
} from "@/types/crawl";
export type { PDFFile } from "@/types/pdf";

// API abstraction layer
export class CrawlService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  static async getPages(url: string): Promise<CrawlAPIResponse> {
    const response = await fetch(
      `${this.API_BASE_URL}/api/crawl/pages?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getArticles(pageUrls: string[]): Promise<CrawlAPIResponse> {
    const response = await fetch(`${this.API_BASE_URL}/api/crawl/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_urls: pageUrls }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async getPDFLinks(articleUrls: string[]): Promise<CrawlAPIResponse> {
    const response = await fetch(`${this.API_BASE_URL}/api/crawl/pdf-links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article_urls: articleUrls }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async checkExistingPDFs(): Promise<ExistingPDFResponse> {
    const response = await fetch(`${this.API_BASE_URL}/api/pdfs/existing`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async downloadPDFs(pdfUrls: string[]): Promise<DownloadAPIResponse> {
    const response = await fetch(`${this.API_BASE_URL}/api/download-pdfs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_urls: pdfUrls }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Storage service for localStorage operations
export class StorageService {
  static readonly CRAWL_JOBS_KEY = "crawlJobs";
  static readonly CRAWL_SETTINGS_KEY = "crawlSettings";
  static readonly PENDING_PDFS_KEY = "pendingPDFs";

  static loadCrawlJobs(): CrawlJob[] {
    if (typeof window === "undefined") return this.getDefaultJobs();

    try {
      const saved = localStorage.getItem(this.CRAWL_JOBS_KEY);
      if (!saved) return this.getDefaultJobs();

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        console.warn("Invalid jobs data in localStorage, using defaults");
        return this.getDefaultJobs();
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
      return this.getDefaultJobs();
    }
  }

  static saveCrawlJobs(jobs: CrawlJob[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.CRAWL_JOBS_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error("Failed to save jobs to localStorage:", error);
    }
  }

  static loadCrawlSettings(): { autoDownloadEnabled: boolean } {
    if (typeof window === "undefined") return { autoDownloadEnabled: true };

    try {
      const saved = localStorage.getItem(this.CRAWL_SETTINGS_KEY);
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
  }

  static saveCrawlSettings(settings: { autoDownloadEnabled: boolean }): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.CRAWL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }

  static savePendingPDFs(pdfFiles: PDFFile[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.PENDING_PDFS_KEY, JSON.stringify(pdfFiles));
    } catch (error) {
      console.error("Failed to save pending PDFs to localStorage:", error);
    }
  }

  private static getDefaultJobs(): CrawlJob[] {
    return [
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
    ];
  }
}

// Utility functions
export const validateUrl = (
  url: string,
): { isValid: boolean; error?: string } => {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return {
        isValid: false,
        error: "URL must start with http:// or https://",
      };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }
};

export const createPDFFile = (url: string, index: number = 0): PDFFile => {
  return {
    id: `crawled-${Date.now()}-${index}`,
    name: decodeURIComponent(url.split("/").pop() || "Unknown.pdf"),
    size: "Unknown",
    status: "pending",
    uploadDate: new Date().toLocaleString(),
    sourceUrl: url,
    pages: 0,
    language: "Vietnamese",
    quality: "medium",
  };
};
