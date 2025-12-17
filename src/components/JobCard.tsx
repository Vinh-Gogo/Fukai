import { motion } from "framer-motion";
import { Download, ExternalLink, Play, Square, RefreshCw, Settings, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface CrawlJob {
  id: string;
  url: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  pagesFound: number;
  pdfsFound: number;
  lastRun: string;
  avgDelay?: number;
  successRate?: number;
  errorMessage?: string;
  pdfUrls?: string[];
  currentStage?: "pages" | "articles" | "pdfs";
  pageUrls?: string[];
  articleUrls?: string[];
}

interface PDFFile {
  id: string;
  name: string;
  size: string;
  status: "pending" | "processing" | "completed" | "error";
  uploadDate: string;
  sourceUrl: string;
  markdownUrl?: string;
  pages: number;
  language: string;
  quality: "high" | "medium" | "low";
}

interface JobCardProps {
  job: CrawlJob;
  isRunning: boolean;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onReRun: (id: string) => void;
  onAddToProcessing: (urls: string[]) => void;
  onDownloadSingle: (url: string) => void;
}

export const JobCard = ({
  job,
  isRunning,
  onStart,
  onStop,
  onReRun,
  onAddToProcessing,
  onDownloadSingle,
}: JobCardProps) => {
  const getStatusText = () => {
    if (job.status === "running") {
      return job.currentStage
        ? `Processing ${job.currentStage}...`
        : "Initializing...";
    }
    return job.status.charAt(0).toUpperCase() + job.status.slice(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden animate-fade-in"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground truncate mb-1">
              {job.url}
            </h3>
            <p className="text-sm text-muted-foreground">
              Last run: {job.lastRun}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Progress Bar */}
        {job.status === "running" && (
          <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex justify-between text-sm text-foreground mb-3">
              <span className="font-medium">
                Progress ({job.currentStage || "Initializing"})
              </span>
              <span className="font-semibold text-primary">
                {job.progress}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-primary h-3 rounded-full"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {job.currentStage === "pages" &&
                "Finding pagination pages..."}
              {job.currentStage === "articles" &&
                `Scanning ${job.pagesFound} pages for articles...`}
              {job.currentStage === "pdfs" &&
                `Extracting PDFs from ${job.articleUrls?.length || 0} articles...`}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Pages Found", value: job.pagesFound, icon: "📄" },
            { label: "PDFs Found", value: job.pdfsFound, icon: "📈" },
            {
              label: "Avg Delay",
              value: job.avgDelay ? `${job.avgDelay}s` : "-",
              icon: "⏱️",
            },
            {
              label: "Success Rate",
              value: job.successRate ? `${job.successRate}%` : "-",
              icon: "✅",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="text-center p-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors duration-200"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Found PDF URLs */}
        {job.status === "completed" && job.pdfUrls && job.pdfUrls.length > 0 && (
          <div className="mb-4 p-4 bg-accent/5 rounded-lg border border-border max-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">
                Found PDF URLs ({job.pdfUrls?.length || 0})
              </h4>
              <button
                onClick={() => onAddToProcessing(job.pdfUrls || [])}
                className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add to Processing
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto pr-2">
              <div className="space-y-2">
                {job.pdfUrls?.slice(0, 5)?.map((url, index) => (
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
                {job.pdfUrls && job.pdfUrls.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ... and {job.pdfUrls.length - 5} more URLs
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {job.status === "error" && job.errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg animate-shake"
          >
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium block">Error:</span>
                <p className="text-sm mt-1">{job.errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/50">
          {job.status === "idle" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStart(job.id)}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                isRunning
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Play className="w-4 h-4" />
              Start Crawl
            </motion.button>
          )}

          {job.status === "running" && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground cursor-not-allowed opacity-70"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStop(job.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </motion.button>
            </>
          )}

          {job.status === "completed" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onReRun(job.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Re-run Crawl
            </motion.button>
          )}

          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background hover:bg-accent transition-colors border border-border"
            >
              <Settings className="w-4 h-4" />
              Settings
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background hover:bg-accent transition-colors border border-border"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
