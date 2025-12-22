import { useCallback } from "react";

/**
 * Hook for managing PDF download tracking with localStorage persistence
 */
export const useDownloadedPDFs = () => {
  const STORAGE_KEY = "downloaded_pdfs";

  const getDownloadedPDFs = useCallback(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const addDownloadedPDF = useCallback(
    (url: string) => {
      if (typeof window === "undefined") return;
      try {
        const downloaded = getDownloadedPDFs();
        downloaded.add(url);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...downloaded]));
      } catch (error) {
        console.error("Failed to save downloaded PDF:", error);
      }
    },
    [getDownloadedPDFs],
  );

  const isPDFDownloaded = useCallback(
    (url: string) => {
      return getDownloadedPDFs().has(url);
    },
    [getDownloadedPDFs],
  );

  return { addDownloadedPDF, isPDFDownloaded };
};
