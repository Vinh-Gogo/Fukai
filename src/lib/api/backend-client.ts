/**
 * Backend API client for communicating with the FastAPI backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Core API Interfaces
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

// Health and Status Interfaces
export interface HealthStatus {
  status: 'healthy' | 'warning' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface DetailedHealthStatus extends HealthStatus {
  checks: {
    database: HealthCheckResult;
    vector_database: HealthCheckResult;
    llm_services: Record<string, HealthCheckResult>;
    system: SystemInfo;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'unhealthy' | 'error';
  message: string;
  error?: string;
}

export interface SystemInfo {
  cpu_percent: number;
  memory: {
    total: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    free: number;
    percent: number;
  };
  error?: string;
}

// Document Interfaces
export interface Document {
  id: string;
  filename: string;
  size: number;
  created_at: string;
  updated_at?: string;
  status: 'processing' | 'completed' | 'error';
  content_type?: string;
  metadata?: Record<string, any>;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page?: number;
  limit?: number;
  message?: string;
}

export interface DocumentUploadRequest {
  file: File;
  metadata?: Record<string, any>;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  size: number;
  status: 'processing' | 'completed';
  message: string;
  url?: string;
}

// Search Interfaces
export interface SearchQuery {
  query: string;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  content_types?: string[];
  date_from?: string;
  date_to?: string;
  size_min?: number;
  size_max?: number;
}

export interface SearchResult {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  score: number;
  highlights?: string[];
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
  execution_time?: number;
  message?: string;
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: string[];
  total: number;
  message?: string;
}

// RAG Interfaces
export interface RAGQuery {
  question: string;
  context_docs?: number;
  conversation_id?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface RAGResponse {
  question: string;
  answer: string;
  sources: RAGSource[];
  confidence: number;
  conversation_id?: string;
  execution_time?: number;
  metadata?: Record<string, any>;
}

export interface RAGSource {
  id: string;
  filename: string;
  content_type: string;
  score: number;
  text: string;
  page_number?: number;
  highlights?: string[];
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  context_docs?: number;
  temperature?: number;
}

export interface ChatResponse {
  message: string;
  response: string;
  conversation_id: string;
  sources: RAGSource[];
  timestamp: string;
}

export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  message?: string;
}

// Crawler Interfaces
export interface CrawlScanResponse {
  success: boolean;
  pages_found: number;
  articles_found: number;
  pdfs_found: number;
  pdf_urls: string[];
  message: string;
  error?: string;
  timestamp: string;
}

export interface CrawlDownloadRequest {
  pdf_urls?: string[];
  output_dir?: string;
}

export interface PDFFileInfo {
  filename: string;
  filepath: string;
  url: string;
  size: number;
  downloaded_at: number;
}

export interface CrawlDownloadResponse {
  success: boolean;
  downloaded_count: number;
  total_count: number;
  files: PDFFileInfo[];
  message: string;
  error?: string;
  timestamp: string;
}

export interface CrawlStatusResponse {
  last_scan?: CrawlScanResponse;
  last_download?: CrawlDownloadResponse;
  downloaded_files_count: number;
  downloaded_files: any[];
}

export interface CrawlerDownloadsResponse {
  files: any[];
  total: number;
  message: string;
}

// API Error Interfaces
export interface APIError {
  error: string;
  message: string;
  status_code: number;
  timestamp: string;
  request_id?: string;
  details?: Record<string, any>;
}

// Common Response Types
export interface APIResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Configuration Interfaces
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface BackendAPIConfig {
  backendURL: string;
  enableCache: boolean;
  cacheTimeout: number;
  enableRetry: boolean;
  maxRetries: number;
}

export class BackendAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || 'admin'; // Default to 'admin' if not provided
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = '';

        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData.details || '';
          }
        } catch (parseError) {
          // If parsing fails, use the raw response text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorDetails;
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as any;
      }
    } catch (error) {
      // Enhanced error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - backend is likely not running
        const networkError = new Error('Unable to connect to backend server. Please ensure the backend is running.');
        (networkError as any).type = 'network';
        (networkError as any).status = 0;
        console.error(`Backend API network error: ${url}`, error);
        throw networkError;
      }

      console.error(`Backend API request failed: ${url}`, error);
      throw error;
    }
  }

  // Health endpoints
  async getHealth() {
    return this.request('/health');
  }

  async getDetailedHealth() {
    return this.request('/health/detailed');
  }

  // Document endpoints
  async uploadDocument(formData: FormData) {
    const url = `${this.baseURL}/api/v1/documents/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document upload failed', error);
      throw error;
    }
  }

  async listDocuments() {
    return this.request('/api/v1/documents/');
  }

  async getDocument(documentId: string) {
    return this.request(`/api/v1/documents/${documentId}`);
  }

  async deleteDocument(documentId: string) {
    return this.request(`/api/v1/documents/${documentId}`, { method: 'DELETE' });
  }

  // Search endpoints
  async searchDocuments(query: string, options: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams({
      query,
      limit: (options.limit || 20).toString(),
      offset: (options.offset || 0).toString(),
    });

    return this.request(`/api/v1/search/?${params}`);
  }

  async getSearchSuggestions(query: string, limit: number = 10) {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    return this.request(`/api/v1/search/suggest?${params}`);
  }

  // RAG endpoints
  async askQuestion(question: string, contextDocs: number = 5) {
    return this.request('/api/v1/rag/ask', {
      method: 'POST',
      body: { question, context_docs: contextDocs },
    });
  }

  async sendChatMessage(message: string, conversationId?: string) {
    return this.request('/api/v1/rag/chat', {
      method: 'POST',
      body: { message, conversation_id: conversationId },
    });
  }

  async getConversations() {
    return this.request('/api/v1/rag/conversations');
  }

  // Crawler endpoints
  async scanForPDFs(baseUrl?: string): Promise<CrawlScanResponse> {
    const endpoint = baseUrl 
      ? `/api/v1/crawler/scan?base_url=${encodeURIComponent(baseUrl)}`
      : '/api/v1/crawler/scan?base_url=https://biwase.com.vn/tin-tuc/ban-tin-biwase';
    return this.request(endpoint);
  }

  async downloadPDFs(request?: CrawlDownloadRequest): Promise<CrawlDownloadResponse> {
    return this.request('/api/v1/crawler/download', {
      method: 'POST',
      body: request || { 
        pdf_urls: [],
        output_dir: "src/store/pdfs"
      },
    });
  }

  async getCrawlerStatus(): Promise<CrawlStatusResponse> {
    return this.request('/api/v1/crawler/status');
  }

  async getCrawlerDownloads(): Promise<CrawlerDownloadsResponse> {
    return this.request('/api/v1/crawler/downloads');
  }

  // API info
  async getAPIInfo() {
    return this.request('/api/v1/');
  }
}

// Export singleton instance
export const backendAPI = new BackendAPIClient(BACKEND_URL);
