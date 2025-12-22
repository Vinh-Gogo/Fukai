import React, { memo } from "react";
import { ArchiveFile } from "@/lib/archive";
import { FileCard } from "./FileCard";

interface FileGridProps {
  files: ArchiveFile[];
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onFilePreview: (file: ArchiveFile) => void;
  onFileDelete: (fileId: string) => void;
}

export const FileGrid = memo(
  ({
    files,
    selectedFiles,
    onFileSelect,
    onFilePreview,
    onFileDelete,
  }: FileGridProps) => {
    if (files.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No files found
          </h3>
          <p className="text-gray-600">Upload some PDFs to see them here</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            onSelect={onFileSelect}
            onPreview={onFilePreview}
            onDelete={onFileDelete}
          />
        ))}
      </div>
    );
  },
);

FileGrid.displayName = "FileGrid";
