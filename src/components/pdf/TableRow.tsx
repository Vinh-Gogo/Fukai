import React, { memo } from "react";
import {
  Download,
  FileText,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFFile } from "./types";

/**
 * Memoized table row component for displaying PDF file information
 */
export const TableRow = memo(
  ({
    file,
    isSelected,
    onRowClick,
    onDownloadClick,
    onDeleteClick,
  }: {
    file: PDFFile;
    isSelected: boolean;
    onRowClick: () => void;
    onDownloadClick: () => void;
    onDeleteClick: () => void;
  }) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case "completed":
          return <CheckCircle className="w-3 h-3 text-green-500" />;
        case "processing":
          return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
        case "error":
          return <AlertCircle className="w-3 h-3 text-red-500" />;
        default:
          return <Clock className="w-3 h-3 text-yellow-500" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "completed":
          return "text-green-600 bg-green-50 border-green-200";
        case "processing":
          return "text-blue-600 bg-blue-50 border-blue-200";
        case "error":
          return "text-red-600 bg-red-50 border-red-200";
        default:
          return "text-yellow-600 bg-yellow-50 border-yellow-200";
      }
    };

    return (
      <tr
        className={cn(
          "hover:bg-gray-50 cursor-pointer transition-colors",
          isSelected && "bg-blue-50",
        )}
        onClick={onRowClick}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-xs">
                {file.sourceUrl}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
              getStatusColor(file.status),
            )}
          >
            <span>{getStatusIcon(file.status)}</span>
            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadClick();
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
              aria-label="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              aria-label="Delete file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

TableRow.displayName = "TableRow";
