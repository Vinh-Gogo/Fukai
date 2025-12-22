import React from "react";
import { Send, Loader2, Mic } from "lucide-react";
import { QuickPrompts } from "./QuickPrompts";

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  selectedPrompt: string | null;
  onPromptSelect: (promptId: string, enhancedQuery: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSubmit,
  onKeyDown,
  selectedPrompt,
  onPromptSelect,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    onKeyDown(e);
  };

  return (
    <div className="rounded-3xl mt-2 flex-shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-6 rounded-b-3xl">
      {/* Quick Prompts Bar */}
      <QuickPrompts
        onPromptSelect={onPromptSelect}
        currentInputValue={inputValue}
        selectedPrompt={selectedPrompt}
        disabled={isLoading}
      />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="rounded-1xl flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your documents..."
            disabled={isLoading}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Voice input (coming soon)"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Press Enter to send</span>
          <span>•</span>
          <span>AI-powered semantic search</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Powered by Vector Search</span>
        </div>
      </div>
    </div>
  );
};
