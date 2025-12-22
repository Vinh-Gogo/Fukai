import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: "online" | "offline" | "typing" | "error" | "success";
  message?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          icon: <Wifi className="h-3 w-3" />,
          color: "text-success-500",
          bgColor: "bg-success-50",
          text: message || "Online",
          topBarColor: "bg-success-500",
        };
      case "offline":
        return {
          icon: <WifiOff className="h-3 w-3" />,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          text: message || "Offline",
          topBarColor: "bg-gray-500",
        };
      case "typing":
        return {
          icon: <TypingDots />,
          color: "text-primary-600",
          bgColor: "bg-primary-50",
          text: message || "Assistant is typing...",
          topBarColor: "bg-primary-600",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          color: "text-error-500",
          bgColor: "bg-error-50",
          text: message || "Error occurred",
          topBarColor: "bg-error-500",
        };
      case "success":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          color: "text-success-500",
          bgColor: "bg-success-50",
          text: message || "Success",
          topBarColor: "bg-success-500",
        };
      default:
        return {
          icon: null,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          text: message || "",
          topBarColor: "bg-gray-500",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <>
      {/* Top bar indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 h-1 z-50",
          config.topBarColor,
        )}
      />

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
          config.bgColor,
          config.color,
          className,
        )}
      >
        {config.icon}
        <span>{config.text}</span>
      </motion.div>
    </>
  );
};

// Typing animation component
const TypingDots: React.FC = () => {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 h-1 bg-primary-600 rounded-full"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default StatusIndicator;
