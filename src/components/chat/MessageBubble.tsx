import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  children: React.ReactNode;
  variant: "user" | "assistant";
  timestamp?: string;
  isLoading?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  children,
  variant,
  timestamp,
  isLoading = false,
  className,
}) => {
  const isUser = variant === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl shadow-sm",
          isUser
            ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-l-2xl rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-r-2xl rounded-bl-md",
          isLoading && "animate-pulse",
          className,
        )}
      >
        <div className="text-sm leading-relaxed">{children}</div>
        {timestamp && (
          <div
            className={cn(
              "text-xs mt-2 opacity-70",
              isUser ? "text-primary-100" : "text-gray-500",
            )}
          >
            {timestamp}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
