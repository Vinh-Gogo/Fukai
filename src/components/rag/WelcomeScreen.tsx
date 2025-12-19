import React from 'react';
import { Bot, FileText, Lightbulb, Search, Target } from 'lucide-react';
import { QUICK_PROMPTS } from '@/lib/chatService';

interface WelcomeScreenProps {
  onQuickPromptSelect: (promptId: string, enhancedQuery: string) => void;
  currentInputValue: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onQuickPromptSelect,
  currentInputValue
}) => {
  const handleQuickPromptClick = (prompt: typeof QUICK_PROMPTS[0]) => {
    const enhancedQuery = `${prompt.query} ${currentInputValue}`.trim();
    onQuickPromptSelect(prompt.id, enhancedQuery);
  };

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
        <Bot className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to RAG Query</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Ask questions about your documents and get AI-powered answers based on your knowledge base.
      </p>

      {/* Quick Start Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {QUICK_PROMPTS.map((prompt) => {
          const IconComponent = getIconForPrompt(prompt.id);
          return (
            <button
              key={prompt.id}
              onClick={() => handleQuickPromptClick(prompt)}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <IconComponent className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{prompt.label}</span>
              </div>
              <p className="text-sm text-gray-600 text-left">{prompt.description}</p>
            </button>
          );
        })}
      </div>
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
