import React from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, Plus } from "lucide-react";

interface PDFListProps {
  pdfUrls: string[];
  onAddToProcessing: (urls: string[]) => void;
  onDownloadSingle: (url: string) => void;
}

export const PDFList = React.memo(({ pdfUrls, onAddToProcessing, onDownloadSingle }: PDFListProps) => {
  if (!pdfUrls || pdfUrls.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-accent/5 rounded-lg border border-border max-h-[300px] overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">
          Found PDF URLs ({pdfUrls.length})
        </h4>
        <button
          onClick={() => onAddToProcessing(pdfUrls)}
          className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add to Processing
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto pr-2">
        <div className="space-y-2">
          {pdfUrls.slice(0, 5).map((url, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between text-sm bg-background p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-mono truncate flex-1 mr-2 min-w-0">
                {decodeURIComponent(url.split("/").pop() || "")}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadSingle(url);
                  }}
                  className="text-success hover:text-success/80 p-1"
                  title="Download PDF"
                  aria-label={`Download ${url.split("/").pop()}`}
                >
                  <Download className="w-4 h-4" />
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 p-1"
                  title="View PDF online"
                  aria-label={`Open ${url.split("/").pop()} in new tab`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
          {pdfUrls.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              ... and {pdfUrls.length - 5} more URLs
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PDFList.displayName = "PDFList";
