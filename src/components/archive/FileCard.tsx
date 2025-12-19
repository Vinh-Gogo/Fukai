import React, { memo } from 'react';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArchiveFile, formatDate } from '@/lib/archive';

interface FileCardProps {
  file: ArchiveFile;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onPreview: (file: ArchiveFile) => void;
  onDelete: (fileId: string) => void;
}

export const FileCard = memo(({
  file,
  isSelected,
  onSelect,
  onPreview,
  onDelete
}: FileCardProps) => {
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.id);
  };

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-blue-500 shadow-lg"
      )}
      onClick={() => onSelect(file.id)}
    >
      {/* Header with checkbox and actions */}
      <div className="flex items-start justify-between mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(file.id)}
          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-1">
          <button
            onClick={handlePreview}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File icon and name */}
      <div className="flex items-center gap-3 mb-3">
        <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-900 truncate text-sm leading-tight">
            {file.name}
          </h4>
          <p className="text-xs text-gray-500">{file.size}</p>
        </div>
      </div>

      {/* File metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>{formatDate(file.downloadDate)}</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
          {file.type}
        </span>
      </div>

      {/* Tags */}
      {file.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {file.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{file.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

FileCard.displayName = 'FileCard';
