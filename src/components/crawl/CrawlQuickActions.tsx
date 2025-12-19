import React from 'react';
import { RefreshCw, Download, Settings } from 'lucide-react';
import { QuickActionCard } from '@/components/features';
import { useActivityLogger } from '@/hooks';
import { CrawlJob } from '@/lib/crawl';

interface CrawlQuickActionsProps {
  jobs: CrawlJob[];
  onDownloadAll: (pdfUrls: string[]) => void;
  disabled?: boolean;
}

export const CrawlQuickActions: React.FC<CrawlQuickActionsProps> = ({
  jobs,
  onDownloadAll,
  disabled = false
}) => {
  const { logActivity } = useActivityLogger();

  const handleRescan = () => {
    logActivity("quick_action_rescan", {
      action: "rescan_biwase",
      current_job_count: jobs.length,
    });
    // TODO: Implement rescan functionality
  };

  const handleDownloadAll = () => {
    const currentJob = jobs.find((job) => job.pdfUrls?.length);
    if (currentJob?.pdfUrls?.length) {
      onDownloadAll(currentJob.pdfUrls);
    } else {
      // TODO: Show toast notification
      console.warn("No PDFs found. Please run a crawl first.");
    }
  };

  const handleSettings = () => {
    logActivity("quick_action_settings", {
      action: "crawl_settings_opened",
    });
    // TODO: Implement settings modal
  };

  return (
    <section className="mb-12 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          icon={RefreshCw}
          title="Rescan Biwase"
          description="Check for new newsletters"
          onClick={handleRescan}
        />
        <QuickActionCard
          icon={Download}
          title="Download All PDFs"
          description="Export found PDF files"
          onClick={handleDownloadAll}
        />
        <QuickActionCard
          icon={Settings}
          title="Crawl Settings"
          description="Configure rate limiting"
          onClick={handleSettings}
        />
      </div>
    </section>
  );
};
