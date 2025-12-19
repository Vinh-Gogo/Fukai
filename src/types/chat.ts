/**
 * Centralized chat and RAG-related types and interfaces
 */

// Core Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  query: string;
  description: string;
}

// Hook Result Types
export interface UseChatMessagesResult {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  getLastMessage: () => ChatMessage | undefined;
  getMessageCount: () => number;
  hasMessages: boolean;
}

export interface UseChatInputResult {
  inputValue: string;
  setInputValue: (value: string) => void;
  clearInput: () => void;
  isValid: boolean;
  handleSubmit: (onSubmit: (value: string) => void) => (e: React.FormEvent) => void;
  handleKeyDown: (onSubmit: (value: string) => void) => (e: React.KeyboardEvent) => void;
}

export interface UseAIResponsesResult {
  generateResponse: (query: string) => Promise<ChatMessage>;
  isLoading: boolean;
  lastResponse?: ChatMessage;
  error?: string;
}

export interface UseChatScrollResult {
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
  isNearBottom: boolean;
}

// Component Props Types
export interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export interface QuickPromptsProps {
  onPromptSelect: (prompt: QuickPrompt) => void;
  className?: string;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
  className?: string;
}

export interface WelcomeScreenProps {
  onPromptSelect: (prompt: QuickPrompt) => void;
  className?: string;
}

// Utility Types
export interface MessageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  averageConfidence: number;
}

// Constants
export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'summary',
    label: 'Summarize',
    icon: () => null, // Will be imported where needed
    query: 'Provide a comprehensive summary of the key points',
    description: 'Get a concise overview'
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: () => null,
    query: 'Explain this concept in simple terms',
    description: 'Break down complex ideas'
  },
  {
    id: 'find',
    label: 'Find Info',
    icon: () => null,
    query: 'Find relevant information about',
    description: 'Search for specific details'
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: () => null,
    query: 'Analyze and provide insights on',
    description: 'Deep analysis & insights'
  }
];

// Type Guards
export const isChatMessage = (obj: unknown): obj is ChatMessage => {
  const message = obj as Record<string, unknown>;
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof message.id === 'string' &&
    typeof message.role === 'string' &&
    ['user', 'assistant'].includes(message.role) &&
    typeof message.content === 'string' &&
    message.timestamp instanceof Date
  );
};

export const isValidMessage = (content: string): MessageValidationResult => {
  const trimmed = content.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
  }

  return { isValid: true };
};

// Utility Functions
export const createErrorMessage = (error: string): ChatMessage => ({
  id: `error-${Date.now()}`,
  role: 'assistant',
  content: `I apologize, but I encountered an error while processing your query: ${error}. Please try again.`,
  timestamp: new Date()
});

export const formatMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  content: message.content.trim()
});

export const getConversationStats = (messages: ChatMessage[]): ConversationStats => {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;
  const averageConfidence = messages
    .filter(m => m.confidence !== undefined)
    .reduce((sum, m) => sum + (m.confidence || 0), 0) / assistantMessages || 0;

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    averageConfidence: Math.round(averageConfidence)
  };
};

// Factory Functions
export const createUserMessage = (content: string): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  role: 'user',
  content: content.trim()
});

export const createAssistantMessage = (
  content: string,
  confidence?: number,
  sources?: string[]
): Omit<ChatMessage, 'id' | 'timestamp'> => ({
  role: 'assistant',
  content: content.trim(),
  confidence,
  sources
});
