"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';

import React, { useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import BrandHeader from "@/components/layout/BrandHeader";
import { Bot } from "lucide-react";

// Custom hooks
import { useChatMessages, useChatInput, useAIResponses, useChatScroll } from "@/hooks";

// Components
import { ChatMessages, ChatInput, WelcomeScreen, TypingIndicator } from "@/components/rag";
import { NavigationSkeleton } from "@/components/navigation";

// Services
import { createErrorMessage } from "@/lib/chat";

// Dynamically import Navigation to prevent SSR issues
const Navigation = dynamic(() => import('@/components/navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => <NavigationSkeleton />
});

export default function RAGPage() {
  // Local state for UI
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // Custom hooks
  const chatMessages = useChatMessages();
  const chatInput = useChatInput();
  const aiResponses = useAIResponses();
  const { messagesEndRef } = useChatScroll([chatMessages.messages.length]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    chatMessages.addMessage({
      role: 'user',
      content: content.trim(),
    });

    // Clear input
    chatInput.clearInput();

    try {
      // Generate AI response
      const aiResponse = await aiResponses.generateResponse(content);

      // Add AI response
      chatMessages.addMessage(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message
      const errorMessage = createErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      chatMessages.addMessage(errorMessage);
    }
  }, [chatMessages, chatInput, aiResponses]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((promptId: string, enhancedQuery: string) => {
    setSelectedPrompt(promptId);
    chatInput.setInputValue(enhancedQuery);

    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage(enhancedQuery);
      setSelectedPrompt(null);
    }, 500);
  }, [chatInput, handleSendMessage]);

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
            <div className="mt-2 h-full overflow-y-auto p-6 space-y-6 rounded-3xl">
              {/* Welcome Screen or Messages */}
              {!chatMessages.hasMessages ? (
                <WelcomeScreen
                  onQuickPromptSelect={handleQuickPrompt}
                  currentInputValue={chatInput.inputValue}
                />
              ) : (
                <>
                  <ChatMessages messages={chatMessages.messages} />
                  {aiResponses.isTyping && <TypingIndicator />}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Chat Input - Fixed at bottom */}
        <ChatInput
          inputValue={chatInput.inputValue}
          onInputChange={chatInput.setInputValue}
          onSubmit={handleSendMessage}
          onKeyDown={chatInput.handleKeyDown(handleSendMessage)}
          selectedPrompt={selectedPrompt}
          onPromptSelect={handleQuickPrompt}
          isLoading={aiResponses.isLoading}
        />
      </div>
    </div>
  );
}
