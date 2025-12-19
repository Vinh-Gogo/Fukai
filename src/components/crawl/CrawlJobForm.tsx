import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateUrl } from '@/lib/crawlService';

interface CrawlJobFormProps {
  onAddJob: (url: string) => void;
  disabled?: boolean;
}

export const CrawlJobForm: React.FC<CrawlJobFormProps> = ({
  onAddJob,
  disabled = false
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    const validation = validateUrl(url.trim());
    if (!validation.isValid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    try {
      onAddJob(url.trim());
      setUrl('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add job');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <section className="mb-8 animate-fade-in">
      <div className="border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Add New Crawl Job
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 transition-colors",
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border focus:border-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!url.trim() || disabled || !!error}
            className={cn(
              "px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2",
              (!url.trim() || disabled || !!error) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </button>
        </form>
      </div>
    </section>
  );
};
