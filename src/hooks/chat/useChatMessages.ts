import { useState, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

interface UseChatMessagesResult {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  getLastMessage: () => ChatMessage | undefined;
  getMessageCount: () => number;
  hasMessages: boolean;
}

const STORAGE_KEY = 'rag-chat-messages';

// Load messages from localStorage
const loadMessagesFromStorage = (): ChatMessage[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((msg: Partial<ChatMessage>) => ({
      id: msg.id || `msg-${Date.now()}`,
      role: msg.role || 'user',
      content: msg.content || '',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      confidence: msg.confidence,
      sources: msg.sources,
    }));
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return [];
  }
};

// Save messages to localStorage
const saveMessagesToStorage = (messages: ChatMessage[]): void => {
  if (typeof window === "undefined") return;

  try {
    // Limit stored messages to last 50 for performance
    const messagesToSave = messages.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

export const useChatMessages = (): UseChatMessagesResult => {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessagesFromStorage);

  // Save messages whenever they change
  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  const addMessage = useCallback((messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...messageData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getLastMessage = useCallback(() => {
    return messages[messages.length - 1];
  }, [messages]);

  const getMessageCount = useCallback(() => {
    return messages.length;
  }, [messages]);

  const hasMessages = messages.length > 0;

  return {
    messages,
    addMessage,
    clearMessages,
    getLastMessage,
    getMessageCount,
    hasMessages,
  };
};
