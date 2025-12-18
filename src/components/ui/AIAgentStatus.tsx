import React from "react";

interface AIAgentStatusProps {
  collapsed: boolean;
}

export const AIAgentStatus = React.memo(({ collapsed }: AIAgentStatusProps) => {
  if (collapsed) {
    return (
      <div className="p-1 border-t border-gray-700 flex justify-center">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">AI</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 border-1 border-gray-700">
      <div className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">AI Agent</div>
          <div className="text-xs text-green-400">Ready • Ultra Mode</div>
        </div>
      </div>
    </div>
  );
});

AIAgentStatus.displayName = "AIAgentStatus";
