// Global search component accessible from any page

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Filter, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useGlobalSearch } from "@/hooks/search/useGlobalSearch";
import { cn } from "@/lib/utils";
import type { SearchResult, SearchFilters } from "@/types/search";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  maxResults?: number;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({
  className,
  placeholder = "Search documents, chat history, and content...",
  showFilters = true,
  maxResults = 10,
  onResultClick,
}: GlobalSearchProps) {
  const {
    query,
    results,
    isLoading,
    error,
    totalCount,
    hasMore,
    search,
    loadMore,
    clearSearch,
    suggestions,
    recentSearches,
    isSearchOpen,
    setIsSearchOpen,
    isInitialized,
  } = useGlobalSearch();

  const [inputValue, setInputValue] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onResultClick?.(result);
      setIsSearchOpen(false);
      setSelectedIndex(-1);

      // Navigate based on result type
      switch (result.type) {
        case "pdf":
          // Navigate to PDF viewer
          window.location.href = `/pdfs?id=${result.id}`;
          break;
        case "chat":
          // Navigate to chat page
          window.location.href = "/rag";
          break;
        default:
          // Stay on current page or navigate to archive
          window.location.href = "/archive";
          break;
      }
    },
    [onResultClick, setIsSearchOpen, setSelectedIndex],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    async (suggestion: { text: string }) => {
      setInputValue(suggestion.text);
      await search(suggestion.text);
      setShowSuggestions(false);
    },
    [search],
  );

  // Handle recent search click
  const handleRecentSearchClick = useCallback(
    async (recentQuery: string) => {
      setInputValue(recentQuery);
      await search(recentQuery);
      setShowSuggestions(false);
    },
    [search],
  );

  // Handle input changes
  const handleInputChange = useCallback(
    async (value: string) => {
      setInputValue(value);
      setSelectedIndex(-1);

      if (value.trim()) {
        await search(value);
        setShowSuggestions(true);
      } else {
        clearSearch();
        setShowSuggestions(false);
      }
    },
    [search, clearSearch],
  );

  // Handle keyboard navigation in results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems =
        results.length + (showSuggestions ? suggestions.length : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < results.length) {
              handleResultClick(results[selectedIndex]);
            } else {
              const suggestionIndex = selectedIndex - results.length;
              if (suggestions[suggestionIndex]) {
                handleSuggestionClick(suggestions[suggestionIndex]);
              }
            }
          } else if (inputValue.trim()) {
            handleInputChange(inputValue);
          }
          break;
        case "Escape":
          setIsSearchOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [
      results,
      suggestions,
      selectedIndex,
      inputValue,
      showSuggestions,
      handleResultClick,
      handleSuggestionClick,
      handleInputChange,
    ],
  );

  // Sync input value with search query
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        inputRef.current?.focus();
      }

      // Close search with Escape
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen, setSelectedIndex]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, setIsSearchOpen, setSelectedIndex]);

  // Get result icon based on type
  const getResultIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄";
      case "chat":
        return "💬";
      case "metadata":
        return "ℹ️";
      default:
        return "📄";
    }
  };

  // Get result type label
  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case "pdf":
        return "PDF Document";
      case "chat":
        return "Chat Message";
      case "metadata":
        return "System Info";
      default:
        return "Document";
    }
  };

  const displayResults = results.slice(0, maxResults);
  const hasResults = displayResults.length > 0;
  const showDropdown =
    isSearchOpen &&
    (hasResults || showSuggestions || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder-gray-400 text-gray-900",
              "transition-all duration-200",
              isSearchOpen && "rounded-b-none border-b-0",
            )}
          />

          {/* Clear button */}
          {inputValue && (
            <button
              onClick={() => {
                setInputValue("");
                clearSearch();
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Keyboard shortcut hint
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">
              <span className="mr-1">⌘</span>K
            </kbd>
          </div> */}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 bg-white border border-t-0 border-gray-300 rounded-b-lg",
            "shadow-lg z-50 max-h-96 overflow-y-auto",
          )}
        >
          {/* Error State */}
          {error && (
            <div className="p-4 text-center text-red-600 bg-red-50 border-b border-red-200">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="max-h-64 overflow-y-auto">
              {displayResults.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0",
                    selectedIndex === index && "bg-blue-50",
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-lg">
                      {getResultIcon(result.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {getResultTypeLabel(result.type)}
                      </span>
                    </div>

                    {result.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {result.subtitle}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {result.content}
                    </p>

                    {result.matches.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.matches.slice(0, 3).map((match, matchIndex) => (
                          <span
                            key={matchIndex}
                            className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                          >
                            {match.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load more results
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="p-2">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Suggestions
                </h5>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2",
                      selectedIndex === results.length + index && "bg-blue-50",
                    )}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{suggestion.text}</span>
                    {suggestion.lastUsed && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(suggestion.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {!hasResults && !showSuggestions && recentSearches.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="p-2">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </h5>
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{recentQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!hasResults &&
            !showSuggestions &&
            !recentSearches.length &&
            inputValue &&
            !isLoading && (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No results found for ${inputValue}</p>
                <p className="text-xs mt-1">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}

          {/* Search Tips */}
          {!inputValue && (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Search Tips:</p>
                <ul className="space-y-1">
                  <li>
                    • Search across PDFs, chat history, and system content
                  </li>
                  <li>• Use quotes for exact phrases</li>
                  <li>• Filter by type: pdf, chat, or metadata</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initialization Status */}
      {!isInitialized && (
        <div className="absolute top-full left-0 right-0 bg-yellow-50 border border-yellow-200 rounded-b-lg p-2">
          <p className="text-xs text-yellow-800">Initializing search...</p>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
