// Search-related type definitions

export interface SearchResult {
  id: string;
  type: 'pdf' | 'chat' | 'metadata';
  title: string;
  subtitle?: string;
  content: string;
  url?: string;
  thumbnail?: string;
  score: number;
  matches: SearchMatch[];
  metadata: SearchMetadata;
}

export interface SearchMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  context: string;
  type: 'title' | 'content' | 'filename' | 'metadata';
}

export interface SearchMetadata {
  size?: number;
  createdAt?: Date;
  modifiedAt?: Date;
  author?: string;
  category?: string;
  tags?: string[];
  language?: string;
  pages?: number;
  fileType?: string;
}

export interface SearchFilters {
  types?: ('pdf' | 'chat' | 'metadata')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  tags?: string[];
  fileSize?: {
    min: number;
    max: number;
  };
  language?: string;
  hasText?: boolean;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'title' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchHistory {
  id: string;
  query: string;
  filters?: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'recent';
  frequency?: number;
  lastUsed?: Date;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  history: SearchHistory[];
  suggestions: SearchSuggestion[];
  savedSearches: SavedSearch[];
}

// Theme-related types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: ThemeMode;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  animations: boolean;
  transitions: boolean;
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  isAuto: boolean;
  isSystemDark: boolean;
}

// PDF enhancement types
export interface PDFBookmark {
  id: string;
  title: string;
  page: number;
  position: { x: number; y: number };
  category?: string;
  notes?: string;
  createdAt: Date;
  color?: string;
}

export interface PDFReadingProgress {
  currentPage: number;
  totalPages: number;
  scrollPosition: number;
  zoom: number;
  lastReadAt: Date;
  readingTime: number; // in minutes
  bookmarks: PDFBookmark[];
}

export interface PDFSessionState {
  fileId: string;
  progress: PDFReadingProgress;
  bookmarks: PDFBookmark[];
  annotations: PDFAnnotation[];
  searchHistory: string[];
  viewMode: 'single' | 'double' | 'continuous';
}

export interface PDFAnnotation {
  id: string;
  page: number;
  type: 'highlight' | 'underline' | 'strike' | 'note';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
  category: 'navigation' | 'search' | 'view' | 'tools';
}

export interface KeyboardShortcutsState {
  shortcuts: KeyboardShortcut[];
  enabled: boolean;
  showHelp: boolean;
}
