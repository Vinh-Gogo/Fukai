"use client";

import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  document_id: string;
  filename: string;
  chunks_created: number;
  total_tokens: number;
  processing_time: number;
  pages: number;
  message: string;
}

interface FileUploadProps {
  onFileProcessed?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  className?: string;
  acceptedTypes?: string[];
  maxFileSize?: number;
  disabled?: boolean;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
  file?: File;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  onError,
  className,
  acceptedTypes = ['.pdf'],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  disabled = false,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!acceptedTypes.some(type => fileExtension === type.toLowerCase())) {
      return `Unsupported file type. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: validationError,
        file,
      });
      onError?.(validationError);
      return;
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      message: 'Uploading file...',
      file,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
      }

      setUploadState({
        status: 'processing',
        progress: 50,
        message: 'Processing document...',
        file,
      });

      const result = await response.json();

      if (result.success) {
        setUploadState({
          status: 'success',
          progress: 100,
          message: `Successfully processed ${result.filename}`,
          file,
        });

        onFileProcessed?.(result);
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        status: 'error',
        progress: 0,
        message: errorMessage,
        file,
      });
      onError?.(errorMessage);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, []);

  const resetUpload = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
      message: '',
    });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return dragActive ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
          getStatusColor(),
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-gray-400'
        )}
        onDrop={!disabled ? handleDrop : undefined}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
        onClick={!disabled ? () => document.getElementById('file-input')?.click() : undefined}
      >
        <input
          id="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              {uploadState.status === 'idle' && 'Upload PDF Document'}
              {uploadState.status === 'uploading' && 'Uploading...'}
              {uploadState.status === 'processing' && 'Processing...'}
              {uploadState.status === 'success' && 'Upload Complete'}
              {uploadState.status === 'error' && 'Upload Failed'}
            </h3>

            {uploadState.message && (
              <p className="text-sm text-gray-600">{uploadState.message}</p>
            )}

            {uploadState.file && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <File className="w-4 h-4" />
                <span>{uploadState.file.name}</span>
                <span>({Math.round(uploadState.file.size / 1024)} KB)</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
            <div className="w-full max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadState.progress}%</p>
            </div>
          )}

          {/* Action buttons */}
          {(uploadState.status === 'success' || uploadState.status === 'error') && (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Upload Another
              </button>

              {uploadState.status === 'error' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (uploadState.file) {
                      uploadFile(uploadState.file);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Overlay for drag state */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
            <p className="text-blue-600 font-medium">Drop file here</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Supported formats: {acceptedTypes.join(', ')} • Max size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
      </div>
    </div>
  );
};
