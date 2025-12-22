import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PDFDocumentProxy } from "@/types/pdf";

interface PDFThumbnailSidebarProps {
  totalPages: number;
  currentPage: number;
  pdfDoc: PDFDocumentProxy | null;
  onGoToPage: (page: number) => void;
  renderThumbnail: (
    pageNumber: number,
    canvas: HTMLCanvasElement,
  ) => Promise<void>;
}

export const PDFThumbnailSidebar: React.FC<PDFThumbnailSidebarProps> = ({
  totalPages,
  currentPage,
  pdfDoc,
  onGoToPage,
  renderThumbnail,
}) => {
  const handleThumbnailClick = useCallback(
    (page: number) => {
      onGoToPage(page);
    },
    [onGoToPage],
  );

  return (
    <div className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-2 border border-gray-200 max-h-[80%] overflow-y-auto">
      <div className="space-y-1 pr-1">
        <div className="px-2 py-1 text-xs font-medium text-gray-600 border-b border-gray-200 mb-1">
          Pages ({totalPages})
        </div>
        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => handleThumbnailClick(page)}
              className={cn(
                "w-16 h-20 rounded-lg flex flex-col items-center justify-center text-xs p-1 border transition-all",
                currentPage === page
                  ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
              )}
              aria-label={`Go to page ${page}`}
            >
              <div className="bg-gray-100 rounded w-12 h-16 mb-1 flex items-center justify-center overflow-hidden">
                <canvas
                  ref={(el) => {
                    if (el && pdfDoc) {
                      renderThumbnail(page, el);
                    }
                  }}
                  className="w-full h-full"
                />
              </div>
              <span className="text-[10px] font-medium">{page}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
