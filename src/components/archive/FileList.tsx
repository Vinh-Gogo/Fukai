import React, { memo } from "react";
import { ArchiveFile } from "@/lib/archive";
import { FileListRow } from "./FileListRow";
import { FileCard } from "./FileCard";

interface FileListProps {
  files: ArchiveFile[];
  selectedFiles: Set<string>;
  onFileSelect: (fileId: string) => void;
  onFilePreview: (file: ArchiveFile) => void;
  onFileDelete: (fileId: string) => void;
}

export const FileList = memo(
  ({
    files,
    selectedFiles,
    onFileSelect,
    onFilePreview,
    onFileDelete,
  }: FileListProps) => {
    if (files.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No files found
          </h3>
          <p className="text-gray-600">Upload some PDFs to see them here</p>
        </div>
      );
    }

    return (
      <>
        {/* Mobile View - Card Layout */}
        <div className="md:hidden space-y-3">
          {/* Mobile Select All */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <input
              type="checkbox"
              checked={
                selectedFiles.size === files.length && files.length > 0
              }
              onChange={() => {
                if (selectedFiles.size === files.length) {
                  // Deselect all
                  files.forEach(
                    (file) =>
                      selectedFiles.has(file.id) &&
                      selectedFiles.delete(file.id),
                  );
                } else {
                  // Select all
                  files.forEach((file) => selectedFiles.add(file.id));
                }
                // Trigger re-render by creating new set
                const newSelected = new Set(selectedFiles);
                selectedFiles.clear();
                newSelected.forEach((id) => selectedFiles.add(id));
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 ml-2">
              Select All ({files.length})
            </span>
          </div>

          {/* Mobile File Cards */}
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

        {/* Desktop View - Table Layout */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedFiles.size === files.length && files.length > 0
                    }
                    onChange={() => {
                      if (selectedFiles.size === files.length) {
                        // Deselect all
                        files.forEach(
                          (file) =>
                            selectedFiles.has(file.id) &&
                            selectedFiles.delete(file.id),
                        );
                      } else {
                        // Select all
                        files.forEach((file) => selectedFiles.add(file.id));
                      }
                      // Trigger re-render by creating new set
                      const newSelected = new Set(selectedFiles);
                      selectedFiles.clear();
                      newSelected.forEach((id) => selectedFiles.add(id));
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => (
                <FileListRow
                  key={file.id}
                  file={file}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={onFileSelect}
                  onPreview={onFilePreview}
                  onDelete={onFileDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  },
);

FileList.displayName = "FileList";
