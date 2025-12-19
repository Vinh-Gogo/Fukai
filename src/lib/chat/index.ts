// Chat service for AI responses and conversation management
import type { ChatMessage, QuickPrompt } from '@/types/chat';

// Re-export types for backwards compatibility
export type { ChatMessage, QuickPrompt } from '@/types/chat';

// Quick action prompts configuration
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

// Generate AI response based on query
export const generateAIResponse = async (query: string): Promise<ChatMessage> => {
  // Simulate AI processing delay
  const delay = 1000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Special case for "Comment" query
  if (query.toLowerCase().trim() === 'comment') {
    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: 'Results Retrieval Found',
      timestamp: new Date(),
      confidence: 98,
      sources: ['System Database', 'Comment Analysis Engine']
    };
  }

  // Generate mock response based on query
  const responses = [
    `Based on my analysis of your documents, here's what I found regarding "${query}":\n\n• Key insights from the uploaded PDFs\n• Relevant information extracted from your knowledge base\n• Confidence score: 92%\n\nSources: Annual Report 2024.pdf, Technical Documentation.pdf`,
    `I've searched through your document collection and discovered several relevant points about "${query}". The information appears in multiple sources with high relevance.\n\nKey findings:\n• Comprehensive data from your archives\n• Cross-referenced information\n• Supporting evidence from uploaded files\n\nWould you like me to elaborate on any specific aspect?`,
    `Regarding "${query}", I found this information in your document repository:\n\n📄 Document 1: Contains detailed information\n📄 Document 2: Supporting data and examples\n📄 Document 3: Additional context and background\n\nAll sources have been verified and cross-referenced for accuracy.`
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return {
    id: `ai-${Date.now()}`,
    role: 'assistant',
    content: randomResponse,
    timestamp: new Date(),
    confidence: Math.floor(85 + Math.random() * 10), // 85-95%
    sources: ['Annual Report 2024.pdf', 'Technical Documentation.pdf', 'User Guide.pdf']
  };
};

// Create error message
export const createErrorMessage = (error: string): ChatMessage => {
  return {
    id: `error-${Date.now()}`,
    role: 'assistant',
    content: `I apologize, but I encountered an error while processing your query: ${error}. Please try again.`,
    timestamp: new Date()
  };
};

// Validate message content
export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  const trimmed = content.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { isValid: false, error: 'Message is too long (max 10,000 characters)' };
  }

  return { isValid: true };
};

// Format message for display
export const formatMessage = (message: ChatMessage): ChatMessage => {
  return {
    ...message,
    content: message.content.trim()
  };
};

// Get conversation statistics
export const getConversationStats = (messages: ChatMessage[]) => {
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
