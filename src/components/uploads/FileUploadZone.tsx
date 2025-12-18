import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  accept = '.pdf',
  maxSize = 50,
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): { valid: File[], invalid: File[] } => {
    const valid: File[] = [];
    const invalid: File[] = [];

    files.forEach(file => {
      // Check file type
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        invalid.push(file);
        return;
      }

      // Check file size (maxSize in MB)
      if (file.size > maxSize * 1024 * 1024) {
        invalid.push(file);
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  }, [maxSize]);

  const handleFiles = useCallback((files: File[]) => {
    const { valid, invalid } = validateFiles(files);

    if (valid.length > 0) {
      onFilesSelected(valid);
    }

    if (invalid.length > 0) {
      // Could emit an error event here for invalid files
      console.warn('Invalid files detected:', invalid.map(f => `${f.name} (${f.size} bytes)`));
    }
  }, [validateFiles, onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    setDragCounter(0);

    if (disabled) return;

    const files = Array.from(e.dataTransfer?.files || []);
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragging ? "bg-blue-100" : "bg-gray-100"
          )}>
            {isDragging ? (
              <CheckCircle className="w-8 h-8 text-blue-600" />
            ) : (
              <Upload className="w-8 h-8 text-gray-600" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              {isDragging ? 'Drop PDF files here' : 'Upload PDF files'}
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop PDF files here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: {maxSize}MB • PDF files only
            </p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
