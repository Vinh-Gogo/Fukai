import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { useCrawlRealtimeStore } from "../../stores/crawlRealtime";

interface PDFListProps {
  pdfUrls: string[];
  onAddToProcessing: (urls: string[]) => void;
  onDownloadSingle: (url: string) => void;
  showRealtimeUrls?: boolean;
  showDataFileUrls?: boolean;
}

export const PDFList = React.memo(
  ({ pdfUrls, onAddToProcessing, onDownloadSingle, showRealtimeUrls = false, showDataFileUrls = false }: PDFListProps) => {
    const realtimeStore = useCrawlRealtimeStore();
    const [dataFileUrls, setDataFileUrls] = useState<string[]>([]);
    const [loadingDataFile, setLoadingDataFile] = useState(false);

    // Load URLs from data file
    const loadDataFileUrls = async () => {
      if (dataFileUrls.length > 0) return; // Already loaded

      setLoadingDataFile(true);
      try {
        const response = await fetch('/api/data/urls');
        if (response.ok) {
          const data = await response.json();
          setDataFileUrls(data.urls || []);
        }
      } catch (error) {
        console.error('Failed to load data file URLs:', error);
      } finally {
        setLoadingDataFile(false);
      }
    };

    // Load data file URLs when component mounts if requested
    useEffect(() => {
      if (showDataFileUrls) {
        loadDataFileUrls();
      }
    }, [showDataFileUrls]);

    // Use real-time URLs if available, otherwise data file URLs, otherwise static URLs
    const urlsToDisplay = useMemo(() => {
      if (showRealtimeUrls && realtimeStore.discoveredUrls.length > 0) {
        return realtimeStore.discoveredUrls;
      }
      if (showDataFileUrls && dataFileUrls.length > 0) {
        return dataFileUrls;
      }
      return pdfUrls;
    }, [pdfUrls, realtimeStore.discoveredUrls, showRealtimeUrls, dataFileUrls, showDataFileUrls]);

    // Don't render if no URLs and not loading
    if (!urlsToDisplay || urlsToDisplay.length === 0) {
      if (showDataFileUrls && loadingDataFile) {
        return (
          <div className="mb-4 p-4 bg-accent/5 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading URLs from data file...</span>
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="mb-4 p-4 bg-accent/5 rounded-lg border border-border max-h-[300px] overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">
            Found PDF URLs ({urlsToDisplay.length})
            {showRealtimeUrls && realtimeStore.discoveredUrls.length > 0 && (
              <span className="text-xs text-green-600 ml-2">(Live)</span>
            )}
            {showDataFileUrls && dataFileUrls.length > 0 && !realtimeStore.discoveredUrls.length && (
              <span className="text-xs text-blue-600 ml-2">(From Data File)</span>
            )}
          </h4>
          <button
            onClick={() => onAddToProcessing(urlsToDisplay)}
            className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add to Processing
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto pr-2">
          <div className="space-y-2">
            {urlsToDisplay.slice(0, 5).map((url, index) => (
              <motion.div
                key={url} // Use URL as key to avoid re-renders during live updates
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
            {urlsToDisplay.length > 5 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ... and {urlsToDisplay.length - 5} more URLs
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

PDFList.displayName = "PDFList";
