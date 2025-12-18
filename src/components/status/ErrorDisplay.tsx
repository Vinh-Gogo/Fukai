import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  errorMessage: string;
}

export const ErrorDisplay = React.memo(({ errorMessage }: ErrorDisplayProps) => {
  if (!errorMessage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg animate-shake"
    >
      <div className="flex items-start gap-2 text-destructive">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <span className="text-sm font-medium block">Error:</span>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      </div>
    </motion.div>
  );
});

ErrorDisplay.displayName = "ErrorDisplay";
