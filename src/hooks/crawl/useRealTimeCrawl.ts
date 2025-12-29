import { useEffect, useLayoutEffect, useCallback, useRef, useState } from 'react';

interface CrawlProgressEvent {
  event: string;
  data: {
    timestamp?: number;
    progress?: number;
    stage?: string;
    message?: string;
    urls?: string[];
    count?: number;
    total_found?: number;
    total_urls?: number;
    pages_found?: number;
    articles_found?: number;
    error?: string;
  };
}

interface UseRealTimeCrawlOptions {
  jobId?: string;
  onProgressUpdate?: (event: CrawlProgressEvent) => void;
  onUrlsFound?: (urls: string[]) => void;
  onCrawlCompleted?: (data: CrawlProgressEvent['data']) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export const useRealTimeCrawl = ({
  jobId,
  onProgressUpdate,
  onUrlsFound,
  onCrawlCompleted,
  onError,
  enabled = false,
}: UseRealTimeCrawlOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;
  const connectRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const pendingErrorRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Use refs instead of setState during cleanup to avoid infinite loops
    reconnectAttemptsRef.current = 0;
  }, []);

  const disconnect = useCallback(() => {
    cleanup();

    if (isMountedRef.current) {
      setIsConnected(false);
      setConnectionError(null);
    }
  }, [cleanup]);

  const connect = useCallback(() => {
    if (!enabled || !process.env.NEXT_PUBLIC_API_BASE_URL) {
      return;
    }

    // Don't create duplicate connections
    if (eventSourceRef.current) {
      return;
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/crawler/progress-stream`;
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        if (isMountedRef.current) {
          setIsConnected(true);
          setConnectionError(null);
        }
        reconnectAttemptsRef.current = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const progressEvent: CrawlProgressEvent = {
            event: event.type,
            data,
          };

          onProgressUpdate?.(progressEvent);

          // Handle specific event types
          switch (event.type) {
            case 'urls_found':
              if (data.urls && Array.isArray(data.urls)) {
                onUrlsFound?.(data.urls);
              }
              break;
            case 'crawl_completed':
              onCrawlCompleted?.(data);
              cleanup();
              if (isMountedRef.current) {
                setIsConnected(false);
              }
              break;
            case 'error':
              onError?.(data.error || 'Unknown error occurred');
              cleanup();
              if (isMountedRef.current) {
                setIsConnected(false);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        if (isMountedRef.current) {
          setIsConnected(false);
          setConnectionError('Connection lost');
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && enabled) {
              connectRef.current?.();
            }
          }, reconnectDelay);
        } else {
          onError?.('Failed to reconnect after multiple attempts');
        }
      };

        } catch (error) {
          console.error('Failed to create EventSource:', error);
          // Defer state update to avoid cascading renders
          setTimeout(() => {
            if (isMountedRef.current) {
              setConnectionError('Failed to establish connection');
            }
            onError?.('Failed to establish connection');
          }, 0);
        }
  }, [enabled, onProgressUpdate, onUrlsFound, onCrawlCompleted, onError, cleanup]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Effect to manage connection lifecycle
  useLayoutEffect(() => {
    if (enabled && isMountedRef.current) {
      // Use the connect function instead of creating EventSource directly
      connectRef.current?.();
    } else {
      cleanup();
      // Use setTimeout to defer state updates and avoid cascading renders
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsConnected(false);
          setConnectionError(null);
        }
      }, 0);
    }

    return () => {
      cleanup();
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
};
