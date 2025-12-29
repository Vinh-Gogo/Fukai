import { useEffect, useCallback, useRef, useState } from 'react';

interface UseCrossTabSyncOptions {
  channelName: string;
  onMessage: (data: unknown) => void;
  enabled?: boolean;
}

interface CrossTabSyncData {
  [key: string]: unknown;
}

export const useCrossTabSync = ({ channelName, onMessage, enabled = true }: UseCrossTabSyncOptions) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isPrimaryRef = useRef(false);
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.BroadcastChannel) {
      return;
    }

    try {
      channelRef.current = new BroadcastChannel(channelName);

      channelRef.current.onmessage = (event) => {
        const { data, source } = event.data;

        // Ignore messages from our own tab
        if (source === 'self') return;

        onMessage(data);
      };

      // Mark this tab as primary if no other tab has claimed it
      const primaryKey = `crawl_primary_tab_${channelName}`;
      const existingPrimary = localStorage.getItem(primaryKey);

      if (!existingPrimary) {
        isPrimaryRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setIsPrimary(true);
        localStorage.setItem(primaryKey, Date.now().toString());
      }

      // Listen for storage changes to detect when primary tab changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === primaryKey && !e.newValue) {
          // Primary tab was closed, claim primary status
          isPrimaryRef.current = true;
          // eslint-disable-next-line react-hooks/exhaustive-deps
          setIsPrimary(true);
          localStorage.setItem(primaryKey, Date.now().toString());
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);

        if (channelRef.current) {
          channelRef.current.close();
          channelRef.current = null;
        }

        // Clean up primary status if this was the primary tab
        if (isPrimaryRef.current) {
          localStorage.removeItem(primaryKey);
          isPrimaryRef.current = false;
        }
      };
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }
  }, [channelName, onMessage, enabled]);

  const broadcast = useCallback((data: CrossTabSyncData) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ data, source: 'self' });
    }

    // Also update localStorage for cross-tab persistence
    try {
      const storageKey = `crawl_data_${channelName}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to update localStorage:', error);
    }
  }, [channelName]);

  const getStoredData = useCallback((): CrossTabSyncData | null => {
    try {
      const storageKey = `crawl_data_${channelName}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }, [channelName]);

  return {
    broadcast,
    getStoredData,
    isPrimary,
  };
};
