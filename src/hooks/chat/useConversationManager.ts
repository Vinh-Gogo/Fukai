import { useState, useEffect, useCallback } from 'react';
import type { ConversationSession, ChatMessage } from '@/types/chat';

const STORAGE_KEY = 'rag-conversations';
const MAX_CONVERSATIONS = 50;

// Type for raw conversation data from localStorage (dates as strings)
interface RawConversationSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO date string
    confidence?: number;
    sources?: string[];
  }>;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

interface UseConversationManagerResult {
  conversations: ConversationSession[];
  currentConversationId: string | null;
  currentConversation: ConversationSession | null;
  createNewConversation: (title?: string) => string;
  switchToConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  updateConversation: (conversationId: string, updates: Partial<ConversationSession>) => void;
  addMessageToConversation: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearAllConversations: () => void;
}

export const useConversationManager = (): UseConversationManagerResult => {
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const rawConversations: RawConversationSession[] = JSON.parse(stored);
        const parsedConversations = rawConversations.map((conv) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        // Defer state updates to avoid cascading renders
        setTimeout(() => {
          setConversations(parsedConversations);
          
          // Set current conversation to most recently updated
          if (parsedConversations.length > 0) {
            const mostRecent = parsedConversations.reduce((prev: ConversationSession, current: ConversationSession) => 
              current.updatedAt > prev.updatedAt ? current : prev
            );
            setCurrentConversationId(mostRecent.id);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      } catch (error) {
        console.error('Failed to save conversations:', error);
      }
    }
  }, [conversations]);

  // Generate conversation title from first message
  const generateTitle = (message: string): string => {
    const words = message.trim().split(' ').slice(0, 5);
    return words.join(' ') + (message.split(' ').length > 5 ? '...' : '');
  };

  // Create a new conversation
  const createNewConversation = useCallback((title?: string): string => {
    const newConversation: ConversationSession = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConversations(prev => [newConversation, ...prev].slice(0, MAX_CONVERSATIONS));
    setCurrentConversationId(newConversation.id);
    
    return newConversation.id;
  }, []);

  // Switch to a different conversation
  const switchToConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
    }
  }, [conversations]);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If deleting current conversation, switch to the most recent one
    if (conversationId === currentConversationId) {
      const remaining = conversations.filter(c => c.id !== conversationId);
      if (remaining.length > 0) {
        const mostRecent = remaining.reduce((prev, current) => 
          current.updatedAt > prev.updatedAt ? current : prev
        );
        setCurrentConversationId(mostRecent.id);
      } else {
        setCurrentConversationId(null);
      }
    }
  }, [conversations, currentConversationId]);

  // Update a conversation
  const updateConversation = useCallback((conversationId: string, updates: Partial<ConversationSession>) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, ...updates, updatedAt: new Date() }
        : conv
    ));
  }, []);

  // Add a message to a conversation
  const addMessageToConversation = useCallback((
    conversationId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const updatedMessages = [...conv.messages, newMessage];
        
        // Generate title from first user message if title is default
        let title = conv.title;
        if (conv.title === 'New Conversation' && message.role === 'user') {
          title = generateTitle(message.content);
        }
        
        return {
          ...conv,
          title,
          messages: updatedMessages,
          updatedAt: new Date()
        };
      }
      return conv;
    }));
  }, []);

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  return {
    conversations,
    currentConversationId,
    currentConversation,
    createNewConversation,
    switchToConversation,
    deleteConversation,
    updateConversation,
    addMessageToConversation,
    clearAllConversations
  };
};
