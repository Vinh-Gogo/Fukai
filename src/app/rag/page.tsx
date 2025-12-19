"use client";

// Disable SSR to prevent hydration issues with browser APIs
export const runtime = 'edge';

import React, { useState, useCallback, useEffect } from "react";
import dynamic from 'next/dynamic';
import BrandHeader from "@/components/layout/BrandHeader";
import { Bot, Plus } from "lucide-react";

// Custom hooks
import { useChatMessages, useChatInput, useAIResponses, useChatScroll, useConversationManager } from "@/hooks";

// Components
import { ChatMessages, ChatInput, WelcomeScreen, TypingIndicator, ConversationHistoryPanel } from "@/components/rag";
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
  const [historyPanelVisible, setHistoryPanelVisible] = useState(false);

  // Custom hooks
  const chatMessages = useChatMessages();
  const chatInput = useChatInput();
  const aiResponses = useAIResponses();
  const { messagesEndRef } = useChatScroll([chatMessages.messages.length]);
  const conversationManager = useConversationManager();

  // Initialize conversation if none exists
  useEffect(() => {
    if (!conversationManager.currentConversationId) {
      conversationManager.createNewConversation();
    }
  }, [conversationManager]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Ensure we have a current conversation
    let conversationId = conversationManager.currentConversationId;
    if (!conversationId) {
      conversationId = conversationManager.createNewConversation();
    }

    // Add user message to conversation
    conversationManager.addMessageToConversation(conversationId, {
      role: 'user',
      content: content.trim(),
    });

    // Add to current chat messages for display
    chatMessages.addMessage({
      role: 'user',
      content: content.trim(),
    });

    // Clear input
    chatInput.clearInput();

    try {
      // Generate AI response
      const aiResponse = await aiResponses.generateResponse(content);

      // Add AI response to conversation
      conversationManager.addMessageToConversation(conversationId, aiResponse);

      // Add to current chat messages for display
      chatMessages.addMessage(aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message
      const errorMessage = createErrorMessage(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      
      // Add error to conversation
      conversationManager.addMessageToConversation(conversationId, errorMessage);
      
      // Add to current chat messages for display
      chatMessages.addMessage(errorMessage);
    }
  }, [chatMessages, chatInput, aiResponses, conversationManager]);

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

  // Handle conversation switching
  const handleSelectConversation = useCallback((conversationId: string) => {
    conversationManager.switchToConversation(conversationId);
    
    // Load conversation messages
    const conversation = conversationManager.conversations.find(c => c.id === conversationId);
    if (conversation) {
      chatMessages.clearMessages();
      conversation.messages.forEach(message => {
        chatMessages.addMessage(message);
      });
    }
  }, [conversationManager, chatMessages]);

  // Handle creating new conversation
  const handleCreateNewConversation = useCallback(() => {
    conversationManager.createNewConversation();
    chatMessages.clearMessages();
    setHistoryPanelVisible(false);
  }, [conversationManager, chatMessages]);

  // Handle deleting conversation
  const handleDeleteConversation = useCallback((conversationId: string) => {
    conversationManager.deleteConversation(conversationId);
    
    // If we deleted the current conversation, clear messages
    if (conversationId === conversationManager.currentConversationId) {
      chatMessages.clearMessages();
      
      // Load the new current conversation if exists
      if (conversationManager.currentConversation) {
        conversationManager.currentConversation.messages.forEach(message => {
          chatMessages.addMessage(message);
        });
      }
    }
  }, [conversationManager, chatMessages]);

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
          
          {/* Floating New Chat Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleCreateNewConversation}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" />
              Create New Dialog Box
            </button>
          </div>

          {/* Chat Interface - Messages only, input fixed at bottom */}
          <div className="flex-1 bg-white/80 backdrop-blur-sm">
            {/* Messages Container */}
            <div className="mt-2 h-full overflow-y-auto p-6 space-y-6 rounded-3xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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

      {/* Conversation History Panel */}
      <ConversationHistoryPanel
        conversations={conversationManager.conversations}
        currentConversationId={conversationManager.currentConversationId}
        isVisible={historyPanelVisible}
        onToggle={() => setHistoryPanelVisible(!historyPanelVisible)}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onCreateNewConversation={handleCreateNewConversation}
      />
    </div>
  );
}
