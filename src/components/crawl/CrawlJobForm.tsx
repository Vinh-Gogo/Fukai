import React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCrawlJobForm } from "@/hooks/crawl/useCrawlJobForm";

interface CrawlJobFormProps {
  onAddJob: (url: string) => void | Promise<void>;
  disabled?: boolean;
}

export const CrawlJobForm: React.FC<CrawlJobFormProps> = ({
  onAddJob,
  disabled = false,
}) => {
  const {
    url,
    error,
    isSubmitting,
    canSubmit,
    handleUrlChange,
    handleSubmit,
    handleKeyPress,
  } = useCrawlJobForm(onAddJob);

  return (
    <section className="mb-8 animate-fade-in">
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Crawl Biwase PDFs
        </h2>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            This crawler scans <strong>https://biwase.com.vn/tin-tuc/ban-tin-biwase</strong> for PDF documents.
            The URL field below is for job identification only.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <input
              type="url"
              placeholder="https://biwase.com.vn/tin-tuc/ban-tin-biwase"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled || isSubmitting}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 transition-colors",
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border focus:border-primary",
                (disabled || isSubmitting) && "opacity-50 cursor-not-allowed",
              )}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={!canSubmit || disabled}
            className={cn(
              "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2",
              (!canSubmit || disabled) && "opacity-50 cursor-not-allowed",
              isSubmitting && "cursor-wait",
            )}
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? "Scanning..." : "Start Scan"}</span>
          </button>
        </form>
      </div>
    </section>
  );
};
