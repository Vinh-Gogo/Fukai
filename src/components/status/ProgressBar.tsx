import React from "react";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  currentStage?: "pages" | "articles" | "pdfs";
}

export const ProgressBar = React.memo(
  ({ progress, currentStage }: ProgressBarProps) => {
    return (
      <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50">
        <div className="flex justify-between text-sm text-foreground mb-3">
          <span className="font-medium">
            Progress ({currentStage || "Initializing"})
          </span>
          <span className="font-semibold text-primary">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-primary h-3 rounded-full"
          />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {currentStage === "pages" && "Finding pagination pages..."}
          {currentStage === "articles" && "Scanning pages for articles..."}
          {currentStage === "pdfs" && "Extracting PDFs from articles..."}
        </div>
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";
