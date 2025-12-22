import React from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

interface PDFPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
}

export const PDFPageNavigation: React.FC<PDFPageNavigationProps> = ({
  currentPage,
  totalPages,
  onGoToPage,
}) => {
  return (
    <div className="bg-gray-50 border-y border-gray-200 p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onGoToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <input
          type="number"
          value={currentPage}
          onChange={(e) => {
            const page = Math.max(
              1,
              Math.min(totalPages, parseInt(e.target.value) || 1),
            );
            onGoToPage(page);
          }}
          min="1"
          max={totalPages}
          className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm"
          aria-label="Current page number"
        />
        <span className="text-sm text-gray-600">of {totalPages}</span>
        <button
          onClick={() => onGoToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden sm:inline">
          Scroll or use arrow keys to navigate
        </span>
        <Info className="w-4 h-4 text-blue-500 cursor-help" />
      </div>
    </div>
  );
};
