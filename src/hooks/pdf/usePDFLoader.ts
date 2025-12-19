import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadPDFDocument,
  extractPDFMetadata,
  validatePDFDocument,
  PDFDocumentInfo,
  PDFDocumentProxy,
  checkPDFSupport
} from '@/lib/pdf';

// Enhanced error types for better error handling
export interface PDFError {
  type: 'network' | 'corrupted' | 'unsupported' | 'timeout' | 'permission' | 'unknown';
  message: string;
  originalError?: Error;
  retryable: boolean;
  userMessage: string;
}

export interface PDFLoaderError extends PDFError {
  url?: string;
  retryCount?: number;
}

export interface UsePDFLoaderResult {
  pdfDoc: PDFDocumentProxy | null;
  isLoading: boolean;
  error: string | null;
  metadata: PDFDocumentInfo | null;
  isValid: boolean;
  loadPDF: (url: string) => Promise<void>;
  unloadPDF: () => void;
  retry: () => Promise<void>;
  isSupported: boolean;
}

export const usePDFLoader = (initialUrl?: string): UsePDFLoaderResult => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<PDFDocumentInfo | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isSupported] = useState(() => checkPDFSupport());
  const currentUrlRef = useRef<string>('');

  // Enhanced error categorization function
  const categorizeError = useCallback((error: unknown, url?: string): PDFLoaderError => {
    const originalError = error instanceof Error ? error : new Error(String(error));

    // Network errors
    if (originalError.message.includes('fetch') || originalError.message.includes('network') ||
        originalError.message.includes('Failed to fetch') || originalError.message.includes('CORS')) {
      return {
        type: 'network',
        message: originalError.message,
        originalError,
        retryable: true,
        userMessage: 'Unable to download the PDF file. Please check your internet connection and try again.',
        url
      };
    }

    // Timeout errors
    if (originalError.message.includes('timeout') || originalError.message.includes('aborted')) {
      return {
        type: 'timeout',
        message: originalError.message,
        originalError,
        retryable: true,
        userMessage: 'The PDF file took too long to load. The file might be large or the server is slow.',
        url
      };
    }

    // Permission errors
    if (originalError.message.includes('permission') || originalError.message.includes('access') ||
        originalError.message.includes('denied')) {
      return {
        type: 'permission',
        message: originalError.message,
        originalError,
        retryable: false,
        userMessage: 'You don\'t have permission to access this PDF file.',
        url
      };
    }

    // Corrupted/invalid PDF
    if (originalError.message.includes('corrupted') || originalError.message.includes('invalid') ||
        originalError.message.includes('Invalid or corrupted')) {
      return {
        type: 'corrupted',
        message: originalError.message,
        originalError,
        retryable: false,
        userMessage: 'This PDF file appears to be corrupted or invalid. Please try a different file.',
        url
      };
    }

    // Unsupported format
    if (originalError.message.includes('unsupported') || originalError.message.includes('format')) {
      return {
        type: 'unsupported',
        message: originalError.message,
        originalError,
        retryable: false,
        userMessage: 'This file format is not supported. Please upload a valid PDF file.',
        url
      };
    }

    // Unknown error
    return {
      type: 'unknown',
      message: originalError.message,
      originalError,
      retryable: true,
      userMessage: 'An unexpected error occurred while loading the PDF. Please try again.',
      url
    };
  }, []);

  const loadPDF = useCallback(async (url: string, retryCount = 0) => {
    if (!url) {
      setError('No PDF URL provided');
      return;
    }

    if (!isSupported) {
      const pdfError = categorizeError(new Error('PDF loading not supported'));
      setError(pdfError.userMessage);
      return;
    }

    // Don't reload the same document
    if (currentUrlRef.current === url && pdfDoc) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Unload previous document
      if (pdfDoc) {
        pdfDoc.destroy();
        setPdfDoc(null);
        setMetadata(null);
        setIsValid(false);
      }

      // Load new document
      const pdf = await loadPDFDocument(url) as PDFDocumentProxy;
      const isValidDoc = await validatePDFDocument(pdf);

      if (!isValidDoc) {
        throw new Error('Invalid or corrupted PDF document');
      }

      // Extract metadata
      const pdfMetadata = await extractPDFMetadata(pdf);

      // Update state
      setPdfDoc(pdf);
      setMetadata(pdfMetadata);
      setIsValid(true);
      currentUrlRef.current = url;

    } catch (err) {
      const pdfError = categorizeError(err, url);
      pdfError.retryCount = retryCount;

      // Log detailed error for debugging
      console.error('PDF Loading Error:', {
        type: pdfError.type,
        message: pdfError.message,
        url,
        retryCount,
        userMessage: pdfError.userMessage,
        originalError: pdfError.originalError
      });

      setError(pdfError.userMessage);
      setIsValid(false);
      setMetadata(null);

      // Clean up on error
      if (pdfDoc) {
        pdfDoc.destroy();
        setPdfDoc(null);
      }

      // Auto-retry for retryable errors (max 2 retries)
      if (pdfError.retryable && retryCount < 2) {
        console.log(`Auto-retrying PDF load (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => {
          loadPDF(url, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [pdfDoc, isSupported, categorizeError]);

  const unloadPDF = useCallback(() => {
    if (pdfDoc) {
      pdfDoc.destroy();
    }
    setPdfDoc(null);
    setMetadata(null);
    setIsValid(false);
    setError(null);
    currentUrlRef.current = '';
  }, [pdfDoc]);

  const retry = useCallback(async () => {
    if (currentUrlRef.current) {
      await loadPDF(currentUrlRef.current);
    }
  }, [loadPDF]);

  // Load initial URL if provided
  useEffect(() => {
    if (initialUrl && isSupported) {
      loadPDF(initialUrl);
    }
  }, [initialUrl, loadPDF, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  return {
    pdfDoc,
    isLoading,
    error,
    metadata,
    isValid,
    loadPDF,
    unloadPDF,
    retry,
    isSupported,
  };
};
