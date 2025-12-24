import React from "react";
import { useActivityLogger } from "@/hooks";

interface CrawlSettingsPanelProps {
  autoDownloadEnabled: boolean;
  onAutoDownloadChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const CrawlSettingsPanel: React.FC<CrawlSettingsPanelProps> = ({
  autoDownloadEnabled,
  onAutoDownloadChange,
  disabled = false,
}) => {
  const { logActivity } = useActivityLogger();

  const handleAutoDownloadChange = (enabled: boolean) => {
    onAutoDownloadChange(enabled);
    logActivity("auto_download_setting_changed", {
      enabled,
      previous_setting: autoDownloadEnabled,
    });
  };

  return (
    <section className="mb-8 animate-fade-in border border-border rounded-xl text-center">
      <div className="px-1 py-1 flex justify-between items-center bg-accent/50 border-b border-border rounded-t-xl gap-4">
        <h2 className="text-xl font-semibold text-foreground mb-1 text-center">
          Auto-Download Settings
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-center">
          <label className="flex items-center cursor-pointer gap-3 text-center">
            <input
              type="checkbox"
              checked={autoDownloadEnabled}
              onChange={(e) => handleAutoDownloadChange(e.target.checked)}
              disabled={disabled}
              className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary/20 focus:ring-2 disabled:opacity-50"
            />
            <span className="font-medium text-foreground text-center">
              Auto-download new PDFs after re-run
            </span>
          </label>
          <p className="text-sm text-muted-foreground max-w-md">
            When enabled, re-running a crawl will automatically download any
            newly discovered PDFs that are not already in storage.
          </p>
        </div>
      </div>
    </section>
  );
};
