// Search engine implementation for full-text search across PDFs and content

import type {
  SearchResult,
  SearchMatch,
  SearchMetadata,
  SearchQuery,
  SearchFilters,
} from "@/types/search";
import { PDFFile } from "@/types/pdf";
import { ChatMessage } from "@/types/chat";

import { PerformanceMonitor } from "@/lib/core/Performance";

export class SearchEngine {
  private static instance: SearchEngine;
  private index: Map<string, SearchDocument> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  // Initialize the search index
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const timer = PerformanceMonitor.startTiming("search-index-initialization");

    try {
      // Load existing PDFs
      await this.indexPDFs();

      // Load chat messages
      await this.indexChatMessages();

      // Load metadata
      await this.indexMetadata();

      this.isInitialized = true;
      timer();
    } catch (error) {
      console.error("Failed to initialize search index:", error);
      timer();
      throw error;
    }
  }

  // Perform search
  async search(query: SearchQuery): Promise<{
    results: SearchResult[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const timer = PerformanceMonitor.startTiming("search-execution");

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const { query: searchQuery, filters, limit = 20, offset = 0 } = query;

      // Tokenize search query
      const tokens = this.tokenize(searchQuery.toLowerCase());

      // Filter documents
      let filteredDocs = Array.from(this.index.values());

      if (filters) {
        filteredDocs = this.applyFilters(filteredDocs, filters);
      }

      // Score and rank results
      const scoredResults = filteredDocs
        .map((doc) => ({
          doc,
          score: this.calculateScore(doc, tokens),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);

      // Apply pagination
      const totalCount = scoredResults.length;
      const paginatedResults = scoredResults.slice(offset, offset + limit);

      // Convert to SearchResult format
      const results = paginatedResults.map(({ doc, score }) =>
        this.documentToSearchResult(doc, tokens, score),
      );

      const hasMore = offset + limit < totalCount;

      timer();
      return { results, totalCount, hasMore };
    } catch (error) {
      console.error("Search failed:", error);
      timer();
      return { results: [], totalCount: 0, hasMore: false };
    }
  }

  // Add document to index
  async addDocument(document: SearchDocument): Promise<void> {
    this.index.set(document.id, document);
  }

  // Remove document from index
  removeDocument(id: string): void {
    this.index.delete(id);
  }

  // Update document in index
  async updateDocument(document: SearchDocument): Promise<void> {
    this.index.set(document.id, document);
  }

  // Clear entire index
  clearIndex(): void {
    this.index.clear();
    this.isInitialized = false;
  }

  // Get search suggestions
  getSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Find partial matches in titles and content
    for (const doc of this.index.values()) {
      // Title suggestions
      if (doc.title.toLowerCase().includes(queryLower)) {
        suggestions.push(doc.title);
      }

      // Content-based suggestions (extract phrases containing query)
      const contentWords = doc.content.toLowerCase().split(/\s+/);
      const queryWords = queryLower.split(/\s+/);

      for (let i = 0; i < contentWords.length - queryWords.length + 1; i++) {
        const phrase = contentWords.slice(i, i + queryWords.length).join(" ");
        if (queryWords.every((word) => phrase.includes(word))) {
          suggestions.push(phrase);
        }
      }
    }

    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, 10);
  }

  private async indexPDFs(): Promise<void> {
    // This would typically load from your PDF storage
    // For now, we'll simulate with mock data
    try {
      // In a real implementation, this would extract text from PDFs
      const mockPDFs: PDFFile[] = [
        {
          id: "pdf-1",
          name: "Annual Report 2024.pdf",
          size: "2.3 MB",
          status: "completed",
          uploadDate: "2025-01-15",
          sourceUrl: "https://example.com/annual-report-2024.pdf",
          pages: 45,
          language: "English",
          quality: "high",
        },
      ];

      for (const pdf of mockPDFs) {
        const doc: SearchDocument = {
          id: pdf.id,
          type: "pdf",
          title: pdf.name,
          content: `This is mock content for ${pdf.name}. In a real implementation, this would contain the extracted text from the PDF document.`,
          metadata: {
            size: this.parseSize(pdf.size),
            createdAt: new Date(pdf.uploadDate),
            pages: pdf.pages,
            language: pdf.language,
            fileType: "application/pdf",
          },
        };
        this.index.set(doc.id, doc);
      }
    } catch (error) {
      console.error("Failed to index PDFs:", error);
    }
  }

  private async indexChatMessages(): Promise<void> {
    // This would load chat messages from storage
    try {
      const mockMessages: ChatMessage[] = [
        {
          id: "chat-1",
          role: "user",
          content: "How do I search for documents?",
          timestamp: new Date("2025-01-16"),
          confidence: 1,
        },
        {
          id: "chat-2",
          role: "assistant",
          content:
            "You can use the search bar at the top of any page to find documents by content, title, or metadata.",
          timestamp: new Date("2025-01-16"),
          confidence: 0.95,
        },
      ];

      for (const message of mockMessages) {
        const doc: SearchDocument = {
          id: message.id,
          type: "chat",
          title: `Chat Message - ${message.role}`,
          content: message.content,
          metadata: {
            createdAt: message.timestamp,
            language: "English",
          },
        };
        this.index.set(doc.id, doc);
      }
    } catch (error) {
      console.error("Failed to index chat messages:", error);
    }
  }

  private async indexMetadata(): Promise<void> {
    // Index metadata about the system
    try {
      const metadataDoc: SearchDocument = {
        id: "metadata-system",
        type: "metadata",
        title: "Web RAG Backup System",
        content:
          "A Next.js web application for managing web crawling, PDF processing, and RAG queries. Allows users to crawl websites for PDF links, process PDFs, and query them using AI.",
        metadata: {
          createdAt: new Date("2025-01-01"),
          language: "English",
          tags: ["web-rag", "pdf-processing", "ai-search"],
        },
      };
      this.index.set(metadataDoc.id, metadataDoc);
    } catch (error) {
      console.error("Failed to index metadata:", error);
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  private applyFilters(
    documents: SearchDocument[],
    filters: SearchFilters,
  ): SearchDocument[] {
    return documents.filter((doc) => {
      // Type filter
      if (filters.types && !filters.types.includes(doc.type)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const docDate = doc.metadata.createdAt || doc.metadata.modifiedAt;
        if (docDate) {
          if (
            docDate < filters.dateRange.start ||
            docDate > filters.dateRange.end
          ) {
            return false;
          }
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (
          !doc.metadata.category ||
          !filters.categories.includes(doc.metadata.category)
        ) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const docTags = doc.metadata.tags || [];
        if (!filters.tags.some((tag) => docTags.includes(tag))) {
          return false;
        }
      }

      // Language filter
      if (filters.language && doc.metadata.language !== filters.language) {
        return false;
      }

      // File size filter
      if (filters.fileSize && doc.metadata.size) {
        if (
          doc.metadata.size < filters.fileSize.min ||
          doc.metadata.size > filters.fileSize.max
        ) {
          return false;
        }
      }

      return true;
    });
  }

  private calculateScore(doc: SearchDocument, tokens: string[]): number {
    let score = 0;
    const content = doc.content.toLowerCase();
    const title = doc.title.toLowerCase();

    for (const token of tokens) {
      // Title matches get higher score
      if (title.includes(token)) {
        score += 10;
      }

      // Content matches get standard score
      const contentMatches = (content.match(new RegExp(token, "g")) || [])
        .length;
      score += contentMatches * 2;

      // Exact phrase matches get bonus
      if (content.includes(tokens.join(" "))) {
        score += 5;
      }
    }

    // Boost recent documents
    if (doc.metadata.createdAt) {
      const daysSinceCreated =
        (Date.now() - doc.metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 3 - daysSinceCreated / 30); // Boost for documents created within 30 days
    }

    return score;
  }

  private documentToSearchResult(
    doc: SearchDocument,
    tokens: string[],
    score: number,
  ): SearchResult {
    const matches = this.findMatches(doc, tokens);

    return {
      id: doc.id,
      type: doc.type,
      title: doc.title,
      subtitle: doc.metadata.category,
      content: this.getContentSnippet(doc.content, tokens),
      url: doc.url,
      score,
      matches,
      metadata: doc.metadata,
    };
  }

  private findMatches(doc: SearchDocument, tokens: string[]): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const content = doc.content.toLowerCase();

    for (const token of tokens) {
      let index = content.indexOf(token);
      while (index !== -1) {
        const startIndex = Math.max(0, index - 50);
        const endIndex = Math.min(content.length, index + token.length + 50);
        const context = doc.content.substring(startIndex, endIndex);

        matches.push({
          text: token,
          startIndex: index - startIndex,
          endIndex: index - startIndex + token.length,
          context,
          type: doc.title.toLowerCase().includes(token) ? "title" : "content",
        });

        index = content.indexOf(token, index + 1);
      }
    }

    return matches.slice(0, 10); // Limit matches per document
  }

  private getContentSnippet(content: string, tokens: string[]): string {
    const words = content.split(/\s+/);
    const relevantWords = words.filter((word) =>
      tokens.some((token) => word.toLowerCase().includes(token)),
    );

    if (relevantWords.length === 0) {
      return content.substring(0, 200) + "...";
    }

    // Find the first relevant word and get context around it
    const firstRelevantIndex = words.findIndex((word) =>
      tokens.some((token) => word.toLowerCase().includes(token)),
    );

    const start = Math.max(0, firstRelevantIndex - 10);
    const end = Math.min(words.length, firstRelevantIndex + 20);

    return (
      words.slice(start, end).join(" ") + (end < words.length ? "..." : "")
    );
  }

  private parseSize(sizeString: string): number {
    const match = sizeString.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
    if (!match) return 0;

    const [, size, unit] = match;
    const multipliers = { KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };

    return (
      parseFloat(size) *
      (multipliers[unit.toUpperCase() as keyof typeof multipliers] || 1)
    );
  }
}

// Internal document interface for indexing
interface SearchDocument {
  id: string;
  type: "pdf" | "chat" | "metadata";
  title: string;
  content: string;
  url?: string;
  metadata: SearchMetadata;
}

export default SearchEngine;
