import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "idle" | "running" | "completed" | "error";
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    running: {
      text: "Running",
      bg: "bg-primary/10",
      textClass: "text-primary",
      border: "border-primary/20",
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
    },
    completed: {
      text: "Completed",
      bg: "bg-success/10",
      textClass: "text-success",
      border: "border-success/20",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    error: {
      text: "Error",
      bg: "bg-destructive/10",
      textClass: "text-destructive",
      border: "border-destructive/20",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    idle: {
      text: "Idle",
      bg: "bg-muted",
      textClass: "text-muted-foreground",
      border: "border-border",
      icon: null,
    },
  };

  const config = statusConfig[status];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2",
        config.bg,
        config.textClass,
        config.border
      )}
    >
      {config.icon}
      {config.text}
    </motion.div>
  );
};
