"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import BrandHeader from "@/components/layout/BrandHeader";
import {
  Search,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  MessageCircle,
  Zap,
  Lightbulb,
  Target,
  FileText,
  Loader2,
  Mic,
  MicOff,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import Navigation to prevent SSR issues
const Navigation = dynamic(() => import('@/components/navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => (
    <div className="w-64 bg-gray-100 animate-pulse">
      <div className="h-16 bg-gray-200 mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

interface QuickPrompt {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  query: string;
  description: string;
}

// Quick action prompts
const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'summary',
    label: 'Summarize',
    icon: FileText,
    query: 'Provide a comprehensive summary of the key points',
    description: 'Get a concise overview'
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: Lightbulb,
    query: 'Explain this concept in simple terms',
    description: 'Break down complex ideas'
  },
  {
    id: 'find',
    label: 'Find Info',
    icon: Search,
    query: 'Find relevant information about',
    description: 'Search for specific details'
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: Target,
    query: 'Analyze and provide insights on',
    description: 'Deep analysis & insights'
  }
];

export default function RAGPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock AI response simulation
  const simulateAIResponse = useCallback(async (query: string): Promise<Message> => {
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    setIsTyping(false);

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
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(content);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your query. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, simulateAIResponse]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((prompt: QuickPrompt) => {
    setSelectedPrompt(prompt.id);
    const enhancedQuery = `${prompt.query} ${inputValue}`.trim();
    setInputValue(enhancedQuery);

    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage(enhancedQuery);
      setSelectedPrompt(null);
    }, 500);
  }, [inputValue, handleSendMessage]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  }, [inputValue, handleSendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  }, [inputValue, handleSendMessage]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/20 overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Navigation isVisible={true} onToggle={() => {}} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content - Scrollable area including header and messages */}
        <main className="flex-1 overflow-y-auto rounded-3xl">
          {/* Brand Header - Now scrolls with content */}
          <BrandHeader
            icon={Bot}
            title="RAG Query"
            subtitle="Vector Search Interface"
            statusText="AI-powered semantic search across your document knowledge base"
          />

          {/* Chat Interface - Messages only, input fixed at bottom */}
          <div className="flex-1 bg-white/80 backdrop-blur-sm">
            {/* Messages Container */}
            <div className="h-full overflow-y-auto p-6 space-y-6">
              {/* Welcome Message */}
              {messages.length === 0 && (
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
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <prompt.icon className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{prompt.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 text-left">{prompt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-4 max-w-4xl",
                    message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-600"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={cn(
                    "max-w-2xl px-6 py-4 rounded-3xl shadow-sm",
                    message.role === 'user'
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  )}>
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Message Metadata */}
                    <div className={cn(
                      "flex items-center justify-between mt-3 pt-3 border-t",
                      message.role === 'user'
                        ? "border-blue-400"
                        : "border-gray-100"
                    )}>
                      <span className={cn(
                        "text-xs",
                        message.role === 'user' ? "text-blue-200" : "text-gray-500"
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>

                      {message.role === 'assistant' && message.confidence && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${message.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {message.confidence}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Sources:</span>
                        {message.sources.map((source, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-4 max-w-4xl mr-auto">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Fixed Input Area - Bottom of screen */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-6 rounded-b-3xl">
          {/* Quick Prompts Bar */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedPrompt === prompt.id
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                )}
              >
                <prompt.icon className="w-4 h-4" />
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="rounded-1xl flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
              {isLoading ? 'Sending...' : 'Send'}
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
              <Sparkles className="w-3 h-3" />
              <span>Powered by Vector Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
