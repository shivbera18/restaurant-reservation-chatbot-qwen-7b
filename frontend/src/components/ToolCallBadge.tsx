import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import type { ToolResult } from '../types';

interface ToolCallBadgeProps {
  toolResults: ToolResult[];
}

export const ToolCallBadge: React.FC<ToolCallBadgeProps> = ({ toolResults }) => {
  const [expanded, setExpanded] = useState(false);

  if (!toolResults || toolResults.length === 0) return null;

  return (
    <div className="my-2 text-left">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-2.5 py-1 bg-neo-purple/15 border-2 border-black shadow-neo-sm hover:shadow-neo transition-all text-xs font-mono font-bold text-black"
      >
        <Wrench className="w-3.5 h-3.5 text-black" />
        <span>
          Executed {toolResults.length} {toolResults.length === 1 ? 'tool' : 'tools'} (MCP)
        </span>
        <div className="flex items-center gap-1">
          {toolResults.map((tr, idx) => (
            <span
              key={idx}
              className={`px-1 py-0.2 text-[10px] border border-black ${
                tr.success ? 'bg-neo-green text-black' : 'bg-red-400 text-white'
              }`}
            >
              {tr.tool_name}
            </span>
          ))}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-1" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 p-2.5 bg-white border-2 border-black shadow-neo font-mono text-xs space-y-2 max-w-full overflow-x-auto">
          {toolResults.map((tr, idx) => (
            <div key={idx} className="border-b border-dashed border-gray-300 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-1.5 font-bold">
                {tr.success ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                )}
                <span className="text-black bg-neo-yellow px-1 border border-black">
                  {tr.tool_name}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {tr.success ? 'Status: 200 OK' : 'Status: Failed'}
                </span>
              </div>

              {tr.data != null && (
                <div className="mt-1 bg-neo-canvas p-1.5 border border-black/30 text-[11px] max-h-36 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all">
                    {typeof tr.data === 'string'
                      ? tr.data
                      : JSON.stringify(tr.data, null, 2)}
                  </pre>
                </div>
              )}

              {tr.error != null && (
                <div className="mt-1 bg-red-100 p-1.5 border border-red-500 text-red-700 text-[11px]">
                  {String(tr.error)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
