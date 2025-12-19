// Unified API Client with retry mechanisms and error handling
import type { PDFFile, ChatMessage } from '@/types';

// API Response base interface
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

// Request configuration interface
export interface RequestConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

// Error classes
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Cache interface for response caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private cache: Map<string, CacheEntry<unknown>>;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.cache = new Map();
  }

  // Generic request method with retry logic
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 30000,
      headers = {}
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new APIError(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (error instanceof APIError && error.status && error.status < 500) {
          throw error;
        }

        if (error instanceof TimeoutError) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw error instanceof APIError ? error : new NetworkError(lastError.message);
        }

        // Wait before retrying with exponential backoff
        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  // Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache management
  private setCache<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // HTTP methods
  async get<T>(
    endpoint: string,
    config: RequestConfig & { useCache?: boolean; cacheTTL?: number } = {}
  ): Promise<T> {
    const { useCache = false, cacheTTL = 300000, ...requestConfig } = config;

    if (useCache) {
      const cached = this.getCache<T>(endpoint);
      if (cached) return cached;
    }

    const result = await this.request<T>(endpoint, { method: 'GET' }, requestConfig);

    if (useCache) {
      this.setCache(endpoint, result, cacheTTL);
    }

    return result;
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, config);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, config);
  }

  async delete<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, config);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint: string): void {
    this.cache.delete(endpoint);
  }
}

// Create singleton instance
const apiClient = new APIClient();

// API service classes for different domains
export class CrawlAPI {
  // Get pages from URL
  static async getPages(url: string): Promise<APIResponse<{ pages: string[] }>> {
    return apiClient.get(`/api/crawl/pages?url=${encodeURIComponent(url)}`, {
      timeout: 45000, // Longer timeout for crawling
    });
  }

  // Get articles from page URLs
  static async getArticles(pageUrls: string[]): Promise<APIResponse<{ articles: string[] }>> {
    return apiClient.post('/api/crawl/articles', { page_urls: pageUrls }, {
      timeout: 60000, // Even longer for article extraction
    });
  }

  // Get PDF links from articles
  static async getPDFLinks(articleUrls: string[]): Promise<APIResponse<{ pdfs: string[] }>> {
    return apiClient.post('/api/crawl/pdf-links', { article_urls: articleUrls }, {
      timeout: 60000,
    });
  }

  // Check existing PDFs
  static async checkExistingPDFs(): Promise<APIResponse<{ pdfs: PDFFile[] }>> {
    return apiClient.get('/api/pdfs/existing', {
      useCache: true,
      cacheTTL: 60000, // Cache for 1 minute
    });
  }

  // Download PDFs
  static async downloadPDFs(pdfUrls: string[]): Promise<APIResponse<{ downloaded: string[]; failed: string[] }>> {
    return apiClient.post('/api/download-pdfs', { pdf_urls: pdfUrls }, {
      timeout: 180000, // 3 minutes for PDF downloads
    });
  }
}

export class FileAPI {
  // Upload file
  static async uploadFile(file: File): Promise<APIResponse<{
    filename: string;
    originalName: string;
    size: number;
    url: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.request('/api/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData (browser sets it with boundary)
    }, {
      timeout: 120000, // 2 minutes for file upload
      retries: 2, // Fewer retries for uploads
    });
  }

  // Delete file
  static async deleteFile(filename: string): Promise<APIResponse<{ success: boolean }>> {
    return apiClient.delete(`/api/delete?filename=${encodeURIComponent(filename)}`);
  }

  // Get file list
  static async getFileList(): Promise<APIResponse<{ files: PDFFile[] }>> {
    return apiClient.get('/api/files', {
      useCache: true,
      cacheTTL: 30000, // Cache for 30 seconds
    });
  }
}

export class ChatAPI {
  // Send chat message
  static async sendMessage(message: string, context?: unknown): Promise<APIResponse<{
    response: string;
    sources?: string[];
    confidence?: number;
  }>> {
    return apiClient.post('/api/chat', { 
      message,
      context 
    }, {
      timeout: 60000, // 1 minute for AI response
    });
  }

  // Get chat history
  static async getChatHistory(): Promise<APIResponse<{ messages: ChatMessage[] }>> {
    return apiClient.get('/api/chat/history', {
      useCache: false, // Don't cache chat history
    });
  }

  // Clear chat history
  static async clearChatHistory(): Promise<APIResponse<{ success: boolean }>> {
    return apiClient.delete('/api/chat/history');
  }
}

export class ActivityAPI {
  // Log activity
  static async logActivity(activity: {
    type: string;
    action: string;
    details?: unknown;
  }): Promise<APIResponse<{ success: boolean }>> {
    return apiClient.post('/api/activity/log', activity);
  }

  // Get activity data
  static async getActivityData(filters?: {
    startDate?: string;
    endDate?: string;
    types?: string[];
  }): Promise<APIResponse<{ activities: unknown[]; stats: unknown }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
    }

    return apiClient.get(`/api/activity/data?${params.toString()}`, {
      useCache: true,
      cacheTTL: 60000, // Cache for 1 minute
    });
  }
}

// Utility functions
export const isNetworkError = (error: Error): boolean => {
  return error instanceof NetworkError || 
         error instanceof TimeoutError ||
         (error instanceof APIError && !error.status);
};

export const isClientError = (error: Error): boolean => {
  return error instanceof APIError &&
         error.status !== undefined &&
         error.status >= 400 &&
         error.status < 500;
};

export const isServerError = (error: Error): boolean => {
  return error instanceof APIError &&
         error.status !== undefined &&
         error.status >= 500;
};

export default apiClient;
