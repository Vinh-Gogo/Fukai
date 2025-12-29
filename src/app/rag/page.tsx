"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = "edge";
import { Send, MessageSquare, FileText, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import BrandHeader from "@/components/layout/BrandHeader";
import { Navigation } from "@/components/navigation";
import { useNavigationContext } from "@/components/navigation/NavigationContext";

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    chunk_id: string;
    document_id: string;
    content: string;
    score: number;
    page_number?: number;
  }>;
  confidence?: number;
  chunks_used?: number;
}

interface RAGResponse {
  question: string;
  answer: string;
  confidence: number;
  chunks_used: number;
  sources: Array<{
    chunk_id: string;
    document_id: string;
    content: string;
    score: number;
    page_number?: number;
    word_count?: number;
  }>;
  metadata: {
    context_length: number;
    processing_time: number;
  };
}

export default function RAGChatPage() {
  const { currentWidth } = useNavigationContext();
  const [isNavigationVisible, setIsNavigationVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I can help you find information from the processed documents. Ask me anything about Biwase reports, company information, or any topics covered in the uploaded PDFs.',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleNavigation = useCallback(() => {
    setIsNavigationVisible((prev) => !prev);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call RAG API
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          max_context_chunks: 5,
          score_threshold: 0.7,
          include_sources: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: RAGResponse = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
        confidence: data.confidence,
        chunks_used: data.chunks_used,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Navigation isVisible={isNavigationVisible} onToggle={toggleNavigation} />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${currentWidth * 4}px` : '0px'
        }}
      >
        {/* Header */}
        <BrandHeader
          icon="bot"
          title="RAG Assistant"
          subtitle="Ask questions about your documents"
          statusText="AI-powered Q&A ready"
        />

        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4 shadow-sm",
                    message.role === 'user'
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200"
                  )}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {/* Metadata for assistant messages */}
                  {message.role === 'assistant' && message.id !== 'welcome' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {message.confidence !== undefined && (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            {message.confidence.toFixed(1)}% confidence
                          </span>
                        )}
                        {message.chunks_used !== undefined && (
                          <span>{message.chunks_used} sources used</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-600 mb-2 font-medium">
                        Sources ({message.sources.length}):
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {message.sources.map((source, index) => (
                          <div
                            key={source.chunk_id}
                            className="bg-gray-50 rounded p-2 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Source {index + 1}</span>
                              <div className="flex items-center gap-2">
                                {source.page_number && (
                                  <span className="text-gray-500">Page {source.page_number}</span>
                                )}
                                <span className="text-green-600 font-medium">
                                  {(source.score * 100).toFixed(1)}% match
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-700 line-clamp-2">
                              {source.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-2 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about the documents..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px] max-h-32"
                  rows={1}
                  disabled={isLoading}
                  style={{
                    height: 'auto',
                    minHeight: '44px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Helper text */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
