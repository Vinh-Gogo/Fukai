import React from 'react';
import { FileText, Lightbulb, Search, Target } from 'lucide-react';
import { QUICK_PROMPTS } from '@/lib/chat';
import { cn } from '@/lib/utils';

interface QuickPromptsProps {
  onPromptSelect: (promptId: string, enhancedQuery: string) => void;
  currentInputValue: string;
  selectedPrompt: string | null;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onPromptSelect,
  currentInputValue,
  selectedPrompt,
  disabled = false
}) => {
  const handlePromptClick = (prompt: typeof QUICK_PROMPTS[0]) => {
    if (disabled) return;
    const enhancedQuery = `${prompt.query} ${currentInputValue}`.trim();
    onPromptSelect(prompt.id, enhancedQuery);
  };

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {QUICK_PROMPTS.map((prompt) => {
        const IconComponent = getIconForPrompt(prompt.id);
        return (
          <button
            key={prompt.id}
            onClick={() => handlePromptClick(prompt)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              selectedPrompt === prompt.id
                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <IconComponent className="w-4 h-4" />
            {prompt.label}
          </button>
        );
      })}
    </div>
  );
};

// Helper function to get icon for prompt
const getIconForPrompt = (promptId: string) => {
  switch (promptId) {
    case 'summary':
      return FileText;
    case 'explain':
      return Lightbulb;
    case 'find':
      return Search;
    case 'analyze':
      return Target;
    default:
      return FileText;
  }
};
