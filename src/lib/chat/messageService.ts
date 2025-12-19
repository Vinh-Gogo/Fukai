// Message utilities and formatting functions

import { ChatMessage } from '../chat';

// Format timestamp for display
export const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format message content for display
export const formatMessageContent = (content: string): string => {
  return content.trim();
};

// Get message display classes based on role
export const getMessageClasses = (role: 'user' | 'assistant') => {
  const baseClasses = "max-w-2xl px-6 py-4 rounded-3xl shadow-sm";

  if (role === 'user') {
    return `${baseClasses} bg-blue-500 text-white`;
  } else {
    return `${baseClasses} bg-white border border-gray-200 text-gray-900`;
  }
};

// Get message container classes
export const getMessageContainerClasses = (role: 'user' | 'assistant') => {
  const baseClasses = "flex items-start gap-4 max-w-4xl";

  if (role === 'user') {
    return `${baseClasses} ml-auto flex-row-reverse`;
  } else {
    return `${baseClasses} mr-auto`;
  }
};

// Get avatar classes based on role
export const getAvatarClasses = (role: 'user' | 'assistant') => {
  const baseClasses = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md";

  if (role === 'user') {
    return `${baseClasses} bg-gradient-to-br from-blue-500 to-blue-600`;
  } else {
    return `${baseClasses} bg-gradient-to-br from-purple-500 to-pink-600`;
  }
};

// Get border classes for message metadata
export const getMessageBorderClasses = (role: 'user' | 'assistant') => {
  if (role === 'user') {
    return "border-blue-400";
  } else {
    return "border-gray-100";
  }
};

// Get text color classes for timestamps
export const getTimestampClasses = (role: 'user' | 'assistant') => {
  if (role === 'user') {
    return "text-blue-200";
  } else {
    return "text-gray-500";
  }
};

// Check if message has sources
export const hasMessageSources = (message: ChatMessage): boolean => {
  return !!(message.sources && message.sources.length > 0);
};

// Check if message has confidence score
export const hasMessageConfidence = (message: ChatMessage): boolean => {
  return message.confidence !== undefined && message.confidence > 0;
};

// Get confidence color based on score
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 90) return 'bg-green-500';
  if (confidence >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Get confidence text color
export const getConfidenceTextColor = (confidence: number): string => {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

// Truncate message content for previews
export const truncateMessage = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

// Check if message is recent (within last hour)
export const isRecentMessage = (message: ChatMessage): boolean => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return message.timestamp > oneHourAgo;
};

// Get message type for analytics
export const getMessageType = (message: ChatMessage): string => {
  if (message.role === 'user') return 'user_query';
  if (message.sources && message.sources.length > 0) return 'ai_response_with_sources';
  if (message.confidence && message.confidence > 0) return 'ai_response_with_confidence';
  return 'ai_response_basic';
};

// Create message preview for notifications
export const createMessagePreview = (message: ChatMessage): string => {
  const content = truncateMessage(message.content, 50);
  if (message.role === 'user') {
    return `You: ${content}`;
  } else {
    return `AI: ${content}`;
  }
};
