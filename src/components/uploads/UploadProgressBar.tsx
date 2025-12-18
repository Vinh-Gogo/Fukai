import React from 'react';
import { CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  size: string;
}

interface UploadProgressBarProps {
  upload: UploadProgress;
  onCancel?: (id: string) => void;
  className?: string;
}

export const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  upload,
  onCancel,
  className
}) => {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'uploading':
        return <Loader className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (upload.status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg p-4 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {upload.fileName}
            </p>
            <p className="text-xs text-gray-500">
              {upload.size}
            </p>
          </div>
        </div>

        {upload.status === 'uploading' && onCancel && (
          <button
            onClick={() => onCancel(upload.id)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            getStatusColor()
          )}
          style={{ width: `${upload.progress}%` }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "font-medium",
          upload.status === 'error' ? 'text-red-600' :
          upload.status === 'completed' ? 'text-green-600' :
          'text-blue-600'
        )}>
          {upload.status === 'uploading' && `${upload.progress}%`}
          {upload.status === 'completed' && 'Completed'}
          {upload.status === 'error' && 'Failed'}
        </span>

        {upload.error && (
          <span className="text-red-600 text-xs truncate ml-2">
            {upload.error}
          </span>
        )}
      </div>
    </div>
  );
};
