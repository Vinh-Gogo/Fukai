import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CrawlRealtimeState {
  // Real-time data
  isConnected: boolean;
  connectionError: string | null;
  discoveredUrls: string[];
  totalUrlsFound: number;
  currentProgress: number;
  currentStage: string;
  lastUpdate: Date | null;

  // Cross-tab sync
  isCrossTabEnabled: boolean;

  // Actions
  setConnectionStatus: (connected: boolean, error?: string | null) => void;
  addDiscoveredUrls: (urls: string[]) => void;
  setProgress: (progress: number, stage?: string) => void;
  resetCrawlState: () => void;
  setCrossTabEnabled: (enabled: boolean) => void;
}

export const useCrawlRealtimeStore = create<CrawlRealtimeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    connectionError: null,
    discoveredUrls: [],
    totalUrlsFound: 0,
    currentProgress: 0,
    currentStage: '',
    lastUpdate: null,
    isCrossTabEnabled: true,

    // Actions
    setConnectionStatus: (connected: boolean, error: string | null = null) => {
      set({
        isConnected: connected,
        connectionError: error,
        lastUpdate: new Date(),
      });
    },

    addDiscoveredUrls: (urls: string[]) => {
      const currentUrls = get().discoveredUrls;
      const newUrls = urls.filter(url => !currentUrls.includes(url));

      if (newUrls.length > 0) {
        set(state => ({
          discoveredUrls: [...state.discoveredUrls, ...newUrls],
          totalUrlsFound: state.totalUrlsFound + newUrls.length,
          lastUpdate: new Date(),
        }));
      }
    },

    setProgress: (progress: number, stage: string = '') => {
      set({
        currentProgress: progress,
        currentStage: stage,
        lastUpdate: new Date(),
      });
    },

    resetCrawlState: () => {
      set({
        discoveredUrls: [],
        totalUrlsFound: 0,
        currentProgress: 0,
        currentStage: '',
        isConnected: false,
        connectionError: null,
        lastUpdate: null,
      });
    },

    setCrossTabEnabled: (enabled: boolean) => {
      set({ isCrossTabEnabled: enabled });
    },
  }))
);
