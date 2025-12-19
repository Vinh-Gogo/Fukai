import React from 'react';
import { JobCard } from '@/components/features';
import { CrawlJob } from '@/lib/crawlService';

interface CrawlJobListProps {
  jobs: CrawlJob[];
  isRunning: boolean;
  onStart: (jobId: string) => void;
  onStop: (jobId: string) => void;
  onReRun: (jobId: string) => void;
  onAddToProcessing: (pdfUrls: string[]) => void;
  onDownloadSingle: (pdfUrl: string) => void;
}

export const CrawlJobList: React.FC<CrawlJobListProps> = ({
  jobs,
  isRunning,
  onStart,
  onStop,
  onReRun,
  onAddToProcessing,
  onDownloadSingle,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No crawl jobs yet. Add your first job above.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Active Jobs
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({jobs.length})
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`w-2 h-2 rounded-full ${
              isRunning
                ? "bg-success animate-pulse"
                : "bg-muted-foreground"
            }`}
          />
          <span className="font-medium">
            {isRunning ? "Running" : "Idle"}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isRunning={isRunning}
            onStart={onStart}
            onStop={onStop}
            onReRun={onReRun}
            onAddToProcessing={onAddToProcessing}
            onDownloadSingle={onDownloadSingle}
          />
        ))}
      </div>
    </section>
  );
};
