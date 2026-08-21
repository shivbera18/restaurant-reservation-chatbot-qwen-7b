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
        className="flex items-center gap-2 px-2.5 py-1 bg-neo-purple/20 dark:bg-neo-purple/30 border-2 border-black dark:border-gray-600 rounded-neo-sm shadow-neo-sm dark:shadow-neo-sm-dark hover:shadow-neo transition-all text-xs font-mono font-bold text-black dark:text-gray-100"
      >
        <Wrench className="w-3.5 h-3.5 text-black dark:text-gray-200" />
        <span>
          Executed {toolResults.length} {toolResults.length === 1 ? 'tool' : 'tools'} (MCP)
        </span>
        <div className="flex items-center gap-1">
          {toolResults.map((tr, idx) => (
            <span
              key={idx}
              className={`px-1.5 py-0.5 text-[10px] border border-black dark:border-gray-600 rounded-neo-sm font-bold ${
                tr.success ? 'bg-neo-green text-black' : 'bg-red-500 text-white'
              }`}
            >
              {tr.tool_name}
            </span>
          ))}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 ml-1 text-black dark:text-gray-200" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 ml-1 text-black dark:text-gray-200" />
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 p-3 bg-white dark:bg-neo-surface border-2 border-black dark:border-gray-600 rounded-neo shadow-neo dark:shadow-neo-dark font-mono text-xs space-y-2.5 max-w-full overflow-hidden">
          {toolResults.map((tr, idx) => (
            <div key={idx} className="border-b border-dashed border-gray-300 dark:border-gray-700 pb-2.5 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-1.5 font-bold">
                {tr.success ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-black bg-neo-yellow px-1.5 py-0.5 border border-black rounded-neo-sm text-[11px]">
                  {tr.tool_name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                  {tr.success ? 'Status: 200 OK' : 'Status: Failed'}
                </span>
              </div>

              {tr.data != null && (
                <div className="mt-1.5 bg-neo-canvas dark:bg-neutral-900 p-2 border border-black/30 dark:border-gray-700 rounded-neo-sm text-[11px] max-h-40 overflow-y-auto text-black dark:text-gray-200">
                  <pre className="whitespace-pre-wrap break-all font-mono">
                    {typeof tr.data === 'string'
                      ? tr.data
                      : JSON.stringify(tr.data, null, 2)}
                  </pre>
                </div>
              )}

              {tr.error != null && (
                <div className="mt-1.5 bg-red-100 dark:bg-red-950/40 p-2 border border-red-500 text-red-800 dark:text-red-300 rounded-neo-sm text-[11px]">
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
