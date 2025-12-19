import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createMemoryManagedRenderTask,
  cancelMemoryManagedRenderTask,
  cleanupCanvasMemory,
  calculateOptimalScale,
  debounce,
  PDFRenderTask,
  PDFDocumentProxy
} from '@/lib/pdf';

// Enhanced error types for PDF rendering
export interface PDFRenderError {
  type: 'canvas' | 'render' | 'memory' | 'timeout' | 'unknown';
  message: string;
  originalError?: Error;
  pageNumber?: number;
  retryable: boolean;
  userMessage: string;
}

export interface UsePDFRendererResult {
  renderPage: (pageNumber: number, canvas: HTMLCanvasElement, pdfDoc?: PDFDocumentProxy, scale?: number) => Promise<void>;
  cancelAllRenders: () => void;
  cleanup: () => void;
  calculateScale: (containerWidth: number, pageWidth: number, zoomLevel?: number) => number;
  activeRenders: PDFRenderTask[];
  isRendering: boolean;
}

export const usePDFRenderer = (): UsePDFRendererResult => {
  const [activeRenders, setActiveRenders] = useState<PDFRenderTask[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const renderQueueRef = useRef<Map<number, PDFRenderTask>>(new Map());
  const maxConcurrentRenders = 3;

  // Debounced render function to prevent excessive rendering
  const debouncedRender = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (pageNumber: number, canvas: HTMLCanvasElement, pdfDoc: PDFDocumentProxy, scale: number) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          if (!pdfDoc) return;

          try {
            // Check if we're at the concurrent render limit
            const currentRenders = Array.from(renderQueueRef.current.values()).filter(
              task => !task.cancelled
            );

            if (currentRenders.length >= maxConcurrentRenders) {
              // Cancel oldest render if we're at limit
              const oldestTask = currentRenders[0];
              if (oldestTask) {
                cancelMemoryManagedRenderTask(oldestTask);
                renderQueueRef.current.delete(oldestTask.pageNumber);
              }
            }

            // Cancel existing render for this page
            const existingTask = renderQueueRef.current.get(pageNumber);
            if (existingTask && !existingTask.cancelled) {
              cancelMemoryManagedRenderTask(existingTask);
            }

            // Get the page
            const page = await pdfDoc.getPage(pageNumber);

            // Create new render task
            const renderTask = createMemoryManagedRenderTask(page, canvas, scale);

            // Add to active renders
            renderQueueRef.current.set(pageNumber, renderTask);
            setActiveRenders(prev => [...prev.filter(t => t.pageNumber !== pageNumber), renderTask]);
            setIsRendering(true);

            // Wait for render to complete
            await (renderTask.task as { promise: Promise<void> }).promise;

            // Remove from active renders on success
            renderQueueRef.current.delete(pageNumber);
            setActiveRenders(prev => prev.filter(t => t.pageNumber !== pageNumber));

          } catch (error) {
            // Remove from active renders on error
            renderQueueRef.current.delete(pageNumber);
            setActiveRenders(prev => prev.filter(t => t.pageNumber !== pageNumber));

            // Only log errors that aren't due to cancellation
            if (!(error instanceof Error) || !error.message.includes('cancelled')) {
              console.error(`Failed to render page ${pageNumber}:`, error);
            }
          } finally {
            // Check if any renders are still active
            const remainingRenders = Array.from(renderQueueRef.current.values()).filter(
              task => !task.cancelled
            );
            setIsRendering(remainingRenders.length > 0);
          }
        }, 100); // 100ms debounce
      };
    })(),
    []
  );

  const renderPage = useCallback(async (
    pageNumber: number,
    canvas: HTMLCanvasElement,
    pdfDoc?: PDFDocumentProxy,
    scale: number = 1.5
  ) => {
    if (!pdfDoc) return;

    // Clean up existing canvas
    cleanupCanvasMemory(canvas);

    // Trigger debounced render
    debouncedRender(pageNumber, canvas, pdfDoc, scale);
  }, [debouncedRender]);

  const cancelAllRenders = useCallback(() => {
    // Cancel all active render tasks
    renderQueueRef.current.forEach(task => {
      cancelMemoryManagedRenderTask(task);
    });

    // Clear the queue
    renderQueueRef.current.clear();
    setActiveRenders([]);
    setIsRendering(false);
  }, []);

  const cleanup = useCallback(() => {
    cancelAllRenders();

    // Clean up any remaining canvas elements
    activeRenders.forEach(task => {
      cleanupCanvasMemory(task.canvas);
    });
  }, [cancelAllRenders, activeRenders]);

  const calculateScale = useCallback(calculateOptimalScale, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    renderPage,
    cancelAllRenders,
    cleanup,
    calculateScale,
    activeRenders,
    isRendering,
  };
};
