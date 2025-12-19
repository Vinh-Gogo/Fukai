import React from 'react';

export const PDFKeyboardShortcuts: React.FC = () => {
  return (
    <div className="bg-gray-50 border-t border-gray-200 p-2 text-center text-xs text-gray-500">
      <span className="hidden sm:inline">Keyboard shortcuts: </span>
      <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">←</kbd> Previous page •
      <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">→</kbd> Next page •
      <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">Ctrl</kbd> +
      <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">+</kbd> Zoom in •
      <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono text-xs">-</kbd> Zoom out
    </div>
  );
};
