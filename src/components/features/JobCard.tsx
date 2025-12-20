import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { StatusBadge } from "../status/StatusBadge";
import { ProgressBar } from "../status/ProgressBar";
import { StatsGrid } from "./StatsGrid";
import { PDFList } from "./PDFList";
import { ErrorDisplay } from "../status/ErrorDisplay";
import { JobControls } from "./JobControls";

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
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onAddToProcessing: (urls: string[]) => void;
  onDownloadSingle: (url: string) => void;
}

export const JobCard = React.memo(({
  job,
  isRunning,
  onStart,
  onStop,
  onReRun,
  onDelete,
  onEdit,
  onAddToProcessing,
  onDownloadSingle,
}: JobCardProps) => {
  const stats = useMemo(() => [
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
  ], [job.pagesFound, job.pdfsFound, job.avgDelay, job.successRate]);

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

        {job.status === "running" && (
          <ProgressBar progress={job.progress} currentStage={job.currentStage} />
        )}

        <StatsGrid stats={stats} />

        {job.status === "completed" && job.pdfUrls && job.pdfUrls.length > 0 && (
          <PDFList
            pdfUrls={job.pdfUrls}
            onAddToProcessing={onAddToProcessing}
            onDownloadSingle={onDownloadSingle}
          />
        )}

        {job.status === "error" && job.errorMessage && (
          <ErrorDisplay errorMessage={job.errorMessage} />
        )}

        <JobControls
          status={job.status}
          isRunning={isRunning}
          onStart={onStart}
          onStop={onStop}
          onReRun={onReRun}
          onDelete={onDelete}
          onEdit={onEdit}
          jobId={job.id}
        />
      </div>
    </motion.div>
  );
});

JobCard.displayName = "JobCard";
