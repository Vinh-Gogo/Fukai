/**
 * Chat hooks - centralized exports
 */

// Chat message management hooks
export { useChatMessages } from "./useChatMessages";

// Chat input handling hooks
export { useChatInput } from "./useChatInput";

// Chat scroll management hooks
export { useChatScroll } from "./useChatScroll";

// AI response generation hooks
export { useAIResponses } from "./useAIResponses";

// Conversation management hooks
export { useConversationManager } from "./useConversationManager";

// Re-export types for convenience
export type {
  ChatMessage,
  QuickPrompt,
  UseChatMessagesResult,
  UseChatInputResult,
  UseAIResponsesResult,
  UseChatScrollResult,
  MessageValidationResult,
  ConversationStats,
} from "@/types/chat";
