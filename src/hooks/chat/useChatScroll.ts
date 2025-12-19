import { useEffect, useRef, useCallback } from 'react';

interface UseChatScrollResult {
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
}

export const useChatScroll = (dependencies: unknown[] = []): UseChatScrollResult => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when dependencies change
  useEffect(() => {
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, ...dependencies]);

  return {
    messagesEndRef,
    scrollToBottom,
  };
};
