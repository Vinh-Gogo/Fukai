import React from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, Play, Square, RefreshCw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobControlsProps {
  status: "idle" | "running" | "completed" | "error";
  isRunning: boolean;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onReRun: (id: string) => void;
  jobId: string;
}

export const JobControls = React.memo(({
  status,
  isRunning,
  onStart,
  onStop,
  onReRun,
  jobId,
}: JobControlsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/50">
      {status === "idle" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStart(jobId)}
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

      {status === "running" && (
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
            onClick={() => onStop(jobId)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </motion.button>
        </>
      )}

      {status === "completed" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onReRun(jobId)}
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
  );
});

JobControls.displayName = "JobControls";
