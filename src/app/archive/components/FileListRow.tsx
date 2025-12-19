import React, { memo } from 'react';
import { FileText, Eye, Trash2 } from 'lucide-react';
import { ArchiveFile, formatDate } from '@/lib/archiveUtils';

interface FileListRowProps {
  file: ArchiveFile;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onPreview: (file: ArchiveFile) => void;
  onDelete: (fileId: string) => void;
}

export const FileListRow = memo(({
  file,
  isSelected,
  onSelect,
  onPreview,
  onDelete
}: FileListRowProps) => {
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(file);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.id);
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(file.id)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate max-w-xs">
            {file.name}
          </span>
        </div>
      </td>

      {/* Size */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {file.size}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(file.downloadDate)}
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {file.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {file.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{file.tags.length - 2} more
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
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
      </td>
    </tr>
  );
});

FileListRow.displayName = 'FileListRow';
