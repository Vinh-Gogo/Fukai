import { useState, useCallback } from "react";
import { ChatMessage } from "./useChatMessages";

interface UseAIResponsesResult {
  isLoading: boolean;
  isTyping: boolean;
  generateResponse: (query: string) => Promise<ChatMessage>;
  cancelResponse: () => void;
}

export const useAIResponses = (): UseAIResponsesResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Mock AI response generation
  const generateResponse = useCallback(
    async (query: string): Promise<ChatMessage> => {
      setIsLoading(true);
      setIsTyping(true);

      try {
        // Simulate typing delay
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 2000),
        );

        setIsTyping(false);

        // Special case for "Comment" query
        if (query.toLowerCase().trim() === "comment") {
          return {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: "Results Retrieval Found",
            timestamp: new Date(),
            confidence: 98,
            sources: ["System Database", "Comment Analysis Engine"],
          };
        }

        // Generate mock response based on query
        const responses = [
          `Based on my analysis of your documents, here's what I found regarding "${query}":\n\n• Key insights from the uploaded PDFs\n• Relevant information extracted from your knowledge base\n• Confidence score: 92%`,
          `I've searched through your document collection and discovered several relevant points about "${query}". The information appears in multiple sources with high relevance.\n\nKey findings:\n• Comprehensive data from your archives\n• Cross-referenced information\n• Supporting evidence from uploaded files\n\nWould you like me to elaborate on any specific aspect?`,
          `Regarding "${query}", I found this information in your document repository:\n\n📄 Document 1: Contains detailed information\n📄 Document 2: Supporting data and examples\n📄 Document 3: Additional context and background\n\nAll sources have been verified and cross-referenced for accuracy.`,
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        return {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: randomResponse,
          timestamp: new Date(),
          confidence: Math.floor(85 + Math.random() * 10), // 85-95%
          sources: [],
        };
      } catch (error) {
        setIsTyping(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const cancelResponse = useCallback(() => {
    setIsLoading(false);
    setIsTyping(false);
  }, []);

  return {
    isLoading,
    isTyping,
    generateResponse,
    cancelResponse,
  };
};
