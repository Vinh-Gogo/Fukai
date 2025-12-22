// Global search hook for the application

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useDebounce } from "@/lib/core/Performance";
import SearchEngine from "@/lib/search/SearchEngine";
import type {
  SearchQuery,
  SearchResult,
  SearchFilters,
  SearchSuggestion,
  SearchHistory,
} from "@/types/search";
import { localStorageAdapter } from "@/lib/core/StateManager";

interface UseGlobalSearchResult {
  // Search state
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;

  // Search actions
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;

  // History and suggestions
  searchHistory: SearchHistory[];
  suggestions: SearchSuggestion[];
  recentSearches: string[];

  // UI state
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isInitialized: boolean;
}

const SEARCH_HISTORY_KEY = "search-history";
const MAX_HISTORY_ITEMS = 20;

// Custom hook for search history persistence
function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored =
        localStorageAdapter.get<SearchHistory[]>(SEARCH_HISTORY_KEY);
      if (stored && Array.isArray(stored)) {
        // Defer state update to avoid cascading renders
        setTimeout(() => setSearchHistory(stored), 0);
      }
    } catch (err) {
      console.error("Failed to load search history:", err);
    }
  }, []);

  // Save search history to localStorage when it changes
  useEffect(() => {
    try {
      localStorageAdapter.set(SEARCH_HISTORY_KEY, searchHistory);
    } catch (err) {
      console.error("Failed to save search history:", err);
    }
  }, [searchHistory]);

  const addToHistory = useCallback(
    (query: string, filters: SearchFilters, resultCount: number) => {
      if (!query.trim()) return;

      const historyEntry: SearchHistory = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        filters,
        timestamp: new Date(),
        resultCount,
      };

      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item.query !== query);
        return [historyEntry, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      });
    },
    [],
  );

  return { searchHistory, addToHistory };
}

// Generate search suggestions based on query and history
function generateSuggestions(
  query: string,
  searchHistory: SearchHistory[],
  searchEngine: SearchEngine,
): SearchSuggestion[] {
  if (!query.trim()) return [];

  try {
    const engineSuggestions = searchEngine.getSuggestions(query);
    const suggestionObjects: SearchSuggestion[] = engineSuggestions.map(
      (text) => ({
        text,
        type: "query" as const,
        lastUsed: searchHistory.find((h) => h.query === text)?.timestamp,
      }),
    );

    const recentSearches = searchHistory.slice(0, 5).map((item) => item.query);
    const recentSuggestions: SearchSuggestion[] = recentSearches
      .filter((search) => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((search) => ({
        text: search,
        type: "recent" as const,
        lastUsed: searchHistory.find((h) => h.query === search)?.timestamp,
      }));

    return [...suggestionObjects, ...recentSuggestions].slice(0, 10);
  } catch (err) {
    console.error("Failed to generate suggestions:", err);
    return [];
  }
}

export function useGlobalSearch(): UseGlobalSearchResult {
  // Search state
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // History and suggestions
  const { searchHistory, addToHistory } = useSearchHistory();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  // Refs for debouncing and pagination
  const searchEngineRef = useRef<SearchEngine | null>(null);
  const currentSearchRef = useRef<string>("");

  // Initialize search engine
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        if (!searchEngineRef.current) {
          searchEngineRef.current = SearchEngine.getInstance();
          await searchEngineRef.current.initialize();
        }
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize search:", err);
        setError("Failed to initialize search engine");
      }
    };

    initializeSearch();
  }, []);

  // Debounced search function
  const debouncedSearch = useDebounce(
    async (searchQuery: string, searchFilters: SearchFilters = {}) => {
      if (!searchEngineRef.current || !searchQuery.trim()) {
        setResults([]);
        setTotalCount(0);
        setHasMore(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setCurrentOffset(0);

        const searchParams: SearchQuery = {
          query: searchQuery,
          filters: searchFilters,
          limit: 20,
          offset: 0,
        };

        const {
          results: searchResults,
          totalCount: total,
          hasMore: more,
        } = await searchEngineRef.current.search(searchParams);

        setResults(searchResults);
        setTotalCount(total);
        setHasMore(more);

        // Add to search history
        addToHistory(searchQuery, searchFilters, total);

        // Update current search ref
        currentSearchRef.current = searchQuery;
      } catch (err) {
        console.error("Search failed:", err);
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    300,
  );

  // Main search function
  const search = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}) => {
      setQuery(searchQuery);
      setFilters(searchFilters);
      await debouncedSearch(searchQuery, searchFilters);
    },
    [debouncedSearch, setIsSearchOpen],
  );

  // Load more results
  const loadMore = useCallback(async () => {
    if (!searchEngineRef.current || !hasMore || isLoading) return;

    try {
      setIsLoading(true);

      const searchParams: SearchQuery = {
        query: currentSearchRef.current,
        filters,
        limit: 20,
        offset: currentOffset + 20,
      };

      const { results: newResults, hasMore: more } =
        await searchEngineRef.current.search(searchParams);

      setResults((prev) => [...prev, ...newResults]);
      setCurrentOffset((prev) => prev + 20);
      setHasMore(more);
    } catch (err) {
      console.error("Load more failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load more results",
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, filters, currentOffset]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setFilters({});
    setResults([]);
    setTotalCount(0);
    setHasMore(false);
    setCurrentOffset(0);
    setError(null);
    currentSearchRef.current = "";
  }, []);

  // Get recent searches (memoized to prevent infinite loops)
  const recentSearches = useMemo(
    () => searchHistory.slice(0, 5).map((item) => item.query),
    [searchHistory],
  );

  // Generate suggestions based on query
  useEffect(() => {
    if (!searchEngineRef.current || !Array.isArray(searchHistory)) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = generateSuggestions(
      query,
      searchHistory,
      searchEngineRef.current,
    );
    setSuggestions(newSuggestions);
  }, [query, searchHistory]);

  return {
    // Search state
    query,
    filters,
    results,
    isLoading,
    error,
    totalCount,
    hasMore,

    // Search actions
    search,
    loadMore,
    clearSearch,

    // History and suggestions
    searchHistory,
    suggestions,
    recentSearches,

    // UI state
    isSearchOpen,
    setIsSearchOpen,
    isInitialized,
  };
}

export default useGlobalSearch;
