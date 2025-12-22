import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 2000,
  className,
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      setIsTyping(value.length > 0);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary-600 transition-all duration-200 p-4">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[20px] max-h-32 resize-none border-0 rounded-none px-0 py-0 focus:ring-0 focus:border-0 bg-transparent text-sm"
            rows={1}
          />

          <div className="absolute right-0 bottom-0 flex items-center gap-2">
            <Button
              type="button"
              variant="icon"
              size="sm"
              disabled={disabled}
              className="h-9 w-9 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="icon"
              size="sm"
              disabled={disabled}
              className="h-9 w-9 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              variant="icon"
              size="sm"
              disabled={disabled || !message.trim()}
              className={cn(
                "h-9 w-9 rounded-lg",
                message.trim()
                  ? "text-primary-600 hover:bg-primary-50"
                  : "text-gray-400",
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {maxLength && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">
              {message.length}/{maxLength}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
