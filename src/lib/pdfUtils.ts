// PDF processing utilities and helper functions

// PDF.js type definitions
export interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  getMetadata(): Promise<PDFMetadata>;
  destroy(): void;
}

export interface PDFPageProxy {
  pageNumber: number;
  getViewport(options: { scale: number }): PDFViewport;
  render(options: PDFRenderOptions): PDFRenderTaskProxy;
  getTextContent(): Promise<PDFTextContent>;
}

export interface PDFViewport {
  height: number;
  width: number;
}

export interface PDFRenderOptions {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

export interface PDFRenderTaskProxy {
  promise: Promise<void>;
  cancel(): void;
}

export interface PDFMetadata {
  info: PDFInfo;
}

export interface PDFInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
}

export interface PDFTextContent {
  items: Array<{ str: string; [key: string]: unknown }>;
}

export interface PDFRenderTask {
  id: string;
  task: PDFRenderTaskProxy;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  cancelled: boolean;
}

export interface PDFDocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Load PDF.js library dynamically
 */
export const loadPDFJS = async () => {
  try {
    const pdfjs = await import('pdfjs-dist');

    // Set worker path for reliability
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }

    return pdfjs;
  } catch (error) {
    console.error('Failed to load PDF.js:', error);
    throw new Error('PDF.js library failed to load');
  }
};

/**
 * Load PDF document with error handling
 */
export const loadPDFDocument = async (url: string) => {
  try {
    const pdfjs = await loadPDFJS();
    const loadingTask = pdfjs.getDocument(url);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF loading timeout')), 30000);
    });

    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    return pdf;
  } catch (error) {
    console.error('Failed to load PDF document:', error);
    throw error;
  }
};

/**
 * Extract PDF metadata
 */
export const extractPDFMetadata = async (pdfDoc: PDFDocumentProxy): Promise<PDFDocumentInfo> => {
  try {
    const metadata = await pdfDoc.getMetadata();
    const info = metadata.info;

    return {
      numPages: pdfDoc.numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
      creator: info?.Creator,
      producer: info?.Producer,
      creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined,
    };
  } catch (error) {
    console.warn('Failed to extract PDF metadata:', error);
    return {
      numPages: pdfDoc.numPages,
    };
  }
};

/**
 * Validate PDF document integrity
 */
export const validatePDFDocument = async (pdfDoc: PDFDocumentProxy): Promise<boolean> => {
  try {
    // Try to access first page to validate document
    await pdfDoc.getPage(1);
    return true;
  } catch (error) {
    console.error('PDF document validation failed:', error);
    return false;
  }
};

/**
 * Create render task with proper error handling
 */
export const createRenderTask = (
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): PDFRenderTask => {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas dimensions
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Create render task
  const renderTask = page.render({
    canvasContext: context,
    viewport: viewport,
  });

  const taskId = `render-${Date.now()}-${Math.random()}`;

  return {
    id: taskId,
    task: renderTask,
    pageNumber: page.pageNumber,
    canvas,
    cancelled: false,
  };
};

/**
 * Cancel render task safely
 */
export const cancelRenderTask = (renderTask: PDFRenderTask): void => {
  if (renderTask.cancelled) return;

  try {
    renderTask.cancelled = true;
    const task = renderTask.task as { cancel?: () => void };
    if (task && typeof task.cancel === 'function') {
      task.cancel();
    }
  } catch (error) {
    console.warn('Failed to cancel render task:', error);
  }
};

/**
 * Clean up canvas resources
 */
export const cleanupCanvas = (canvas: HTMLCanvasElement): void => {
  try {
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  } catch (error) {
    console.warn('Failed to cleanup canvas:', error);
  }
};

/**
 * Calculate optimal scale for canvas rendering
 */
export const calculateOptimalScale = (
  containerWidth: number,
  pageWidth: number,
  zoomLevel: number = 1
): number => {
  const baseScale = containerWidth / pageWidth;
  const scaled = baseScale * zoomLevel;

  // Limit scale to reasonable bounds
  return Math.max(0.5, Math.min(3.0, scaled));
};

/**
 * Check if device supports high DPI rendering
 */
export const supportsHighDPI = (): boolean => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const devicePixelRatio = window.devicePixelRatio || 1;

  return context !== null && devicePixelRatio > 1;
};

/**
 * Get device pixel ratio for high DPI rendering
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memory usage estimation for PDF documents
 */
export const estimatePDFMemoryUsage = (pdfDoc: PDFDocumentProxy): number => {
  // Rough estimation: assume ~50KB per page for rendered content
  // Plus base document overhead
  const baseOverhead = 1024 * 1024; // 1MB base
  const perPageOverhead = 50 * 1024; // 50KB per page

  return baseOverhead + (pdfDoc.numPages * perPageOverhead);
};

/**
 * Canvas pool for memory management and performance optimization
 */
class CanvasPool {
  private pool: HTMLCanvasElement[] = [];
  private maxSize = 10;

  getCanvas(): HTMLCanvasElement {
    let canvas = this.pool.pop();
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    return canvas;
  }

  returnCanvas(canvas: HTMLCanvasElement): void {
    // Clear canvas before returning to pool
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Reset dimensions
    canvas.width = 0;
    canvas.height = 0;

    if (this.pool.length < this.maxSize) {
      this.pool.push(canvas);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }
}

// Global canvas pool instance
const canvasPool = new CanvasPool();

/**
 * Get canvas from pool for rendering
 */
export const getCanvasFromPool = (): HTMLCanvasElement => {
  return canvasPool.getCanvas();
};

/**
 * Return canvas to pool for reuse
 */
export const returnCanvasToPool = (canvas: HTMLCanvasElement): void => {
  canvasPool.returnCanvas(canvas);
};

/**
 * Memory-aware canvas cleanup
 */
export const cleanupCanvasMemory = (canvas: HTMLCanvasElement): void => {
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear canvas content
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clear any image data
      if (ctx.getImageData) {
        try {
          ctx.getImageData(0, 0, 1, 1);
        } catch (e) {
          // Ignore errors from getImageData
        }
      }
    }

    // Return to pool instead of destroying
    returnCanvasToPool(canvas);
  } catch (error) {
    console.warn('Failed to cleanup canvas memory:', error);
  }
};

/**
 * Preload adjacent pages for smoother scrolling
 */
export const preloadAdjacentPages = async (
  pdfDoc: PDFDocumentProxy,
  currentPage: number,
  preloadRange: number = 2
): Promise<void> => {
  const pagesToPreload: number[] = [];

  // Preload pages before current page
  for (let i = Math.max(1, currentPage - preloadRange); i < currentPage; i++) {
    if (!pagesToPreload.includes(i)) {
      pagesToPreload.push(i);
    }
  }

  // Preload pages after current page
  for (let i = currentPage + 1; i <= Math.min(pdfDoc.numPages, currentPage + preloadRange); i++) {
    if (!pagesToPreload.includes(i)) {
      pagesToPreload.push(i);
    }
  }

  // Preload pages asynchronously without blocking
  pagesToPreload.forEach(async (pageNumber) => {
    try {
      await pdfDoc.getPage(pageNumber);
    } catch (error) {
      // Silently fail for preloading
      console.debug(`Failed to preload page ${pageNumber}:`, error);
    }
  });
};

/**
 * Enhanced render task with memory management
 */
export const createMemoryManagedRenderTask = (
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): PDFRenderTask => {
  // Get canvas from pool
  const renderCanvas = getCanvasFromPool();

  const viewport = page.getViewport({ scale });
  const context = renderCanvas.getContext('2d');

  if (!context) {
    returnCanvasToPool(renderCanvas);
    throw new Error('Failed to get canvas context');
  }

  // Set canvas dimensions
  renderCanvas.height = viewport.height;
  renderCanvas.width = viewport.width;

  // Clear canvas
  context.clearRect(0, 0, renderCanvas.width, renderCanvas.height);

  // Create render task
  const renderTask = page.render({
    canvasContext: context,
    viewport: viewport,
  });

  const taskId = `render-${Date.now()}-${Math.random()}`;

  return {
    id: taskId,
    task: renderTask,
    pageNumber: page.pageNumber,
    canvas: renderCanvas,
    cancelled: false,
  };
};

/**
 * Memory-managed render task cancellation
 */
export const cancelMemoryManagedRenderTask = (renderTask: PDFRenderTask): void => {
  if (renderTask.cancelled) return;

  try {
    renderTask.cancelled = true;
    const task = renderTask.task as { cancel?: () => void };
    if (task && typeof task.cancel === 'function') {
      task.cancel();
    }

    // Return canvas to pool
    returnCanvasToPool(renderTask.canvas);
  } catch (error) {
    console.warn('Failed to cancel memory-managed render task:', error);
  }
};

/**
 * Check if browser supports required PDF features
 */
export const checkPDFSupport = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for canvas support
  const canvas = document.createElement('canvas');
  if (!canvas.getContext) return false;

  // Check for basic canvas 2D support
  const context = canvas.getContext('2d');
  if (!context) return false;

  // Check for required methods
  if (!context.clearRect || !context.drawImage) return false;

  return true;
};
