import React from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  page: number;
  text: string;
  index: number;
}

interface PDFSearchPanelProps {
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearching: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigateResult: (direction: "next" | "prev") => void;
  onGoToPage: (page: number) => void;
  onClearSearch: () => void;
}

export const PDFSearchPanel: React.FC<PDFSearchPanelProps> = ({
  searchQuery,
  searchResults,
  currentSearchIndex,
  isSearching,
  onSearchChange,
  onNavigateResult,
  onGoToPage,
  onClearSearch,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search in PDF..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSearching}
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentSearchIndex + 1} of {searchResults.length}
            </span>
            <button
              onClick={() => onNavigateResult("prev")}
              disabled={searchResults.length <= 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              aria-label="Previous search result"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateResult("next")}
              disabled={searchResults.length <= 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              aria-label="Next search result"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={onClearSearch}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          aria-label="Close search"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-4 max-h-32 overflow-y-auto">
          <div className="text-sm text-gray-600 mb-2">
            Found {searchResults.length} result
            {searchResults.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-1">
            {searchResults.slice(0, 5).map((result, index) => (
              <button
                key={result.index}
                onClick={() => {
                  // Update current search index and go to page
                  onGoToPage(result.page);
                }}
                className={cn(
                  "w-full text-left p-2 rounded hover:bg-gray-50 transition-colors",
                  currentSearchIndex === result.index &&
                    "bg-blue-50 border border-blue-200",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Page {result.page}
                  </span>
                  <span className="text-xs text-gray-500">
                    #{result.index + 1}
                  </span>
                </div>
                <div className="text-xs text-gray-600 truncate mt-1">
                  {result.text}
                </div>
              </button>
            ))}
            {searchResults.length > 5 && (
              <div className="text-xs text-gray-500 text-center py-1">
                ... and {searchResults.length - 5} more results
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
