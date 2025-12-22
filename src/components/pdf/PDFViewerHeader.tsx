import React from "react";
import { X, Minus, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFViewerProps } from "./types";

interface PDFViewerHeaderProps extends Pick<PDFViewerProps, "onClose"> {
  fileName: string;
  totalPages: number;
  currentPage: number;
  zoomLevel: number;
  zoomPresets: number[];
  showSearch: boolean;
  onToggleSearch: () => void;
  onZoomChange: (zoom: number) => void;
}

export const PDFViewerHeader: React.FC<PDFViewerHeaderProps> = ({
  onClose,
  fileName,
  totalPages,
  currentPage,
  zoomLevel,
  zoomPresets,
  showSearch,
  onToggleSearch,
  onZoomChange,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close preview"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h3 className="font-bold text-xl truncate max-w-md">{fileName}</h3>
          <div className="flex items-center gap-3 mt-1 text-sm opacity-90">
            <div className="flex items-center gap-1">
              <span>{totalPages} pages</span>
            </div>
            <div className="flex items-center gap-1">
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Search Toggle */}
        <button
          onClick={onToggleSearch}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showSearch
              ? "bg-white/30 text-white"
              : "text-white/80 hover:bg-white/20",
          )}
          aria-label="Toggle search"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoomLevel - 0.1))}
            className="p-1 hover:bg-white/30 rounded"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <select
            value={zoomLevel}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="bg-transparent text-white text-sm font-medium border-none outline-none cursor-pointer min-w-16"
            aria-label="Zoom level"
          >
            {zoomPresets.map((preset) => (
              <option key={preset} value={preset} className="text-black">
                {Math.round(preset * 100)}%
              </option>
            ))}
          </select>
          <button
            onClick={() => onZoomChange(Math.min(3, zoomLevel + 0.1))}
            className="p-1 hover:bg-white/30 rounded"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onZoomChange(1)}
          className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
          aria-label="Reset zoom"
        >
          Fit Width
        </button>
      </div>
    </div>
  );
};
