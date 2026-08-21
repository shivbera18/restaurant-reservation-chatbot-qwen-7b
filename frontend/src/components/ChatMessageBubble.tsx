import { Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Restaurant } from '../types';
import { ReservationTicket } from './ReservationTicket';
import { RestaurantCard } from './RestaurantCard';
import { ToolCallBadge } from './ToolCallBadge';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  copied: boolean;
  onCopy: () => void;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  onCancelReservation?: (code: string) => Promise<void>;
}

export function ChatMessageBubble({ message, copied, onCopy, onSelectRestaurant, onCancelReservation }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);

  return (
    <article className={`animate-message-in flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>

      <div className={`group relative max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-2xl px-4 py-3 text-left text-sm leading-6 ${
            isUser
              ? 'rounded-tr-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm'
              : 'rounded-tl-md border border-neutral-200 bg-white text-neutral-800 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
          }`}
        >
          <button
            onClick={onCopy}
            aria-label="Copy message"
            className={`absolute right-2 top-2 rounded-md p-1 opacity-0 transition group-hover:opacity-100 focus:opacity-100 ${isUser ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <div className="prose prose-sm max-w-none pr-5 text-current prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-li:text-inherit">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {message.tool_results && message.tool_results.length > 0 && <ToolCallBadge toolResults={message.tool_results} />}

          {message.selected_restaurant && (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Featured venue</span>
              <RestaurantCard restaurant={message.selected_restaurant} onSelect={onSelectRestaurant} />
            </div>
          )}

          {message.created_reservation && (
            <div className="mt-4">
              <ReservationTicket reservation={message.created_reservation} onCancel={onCancelReservation} />
            </div>
          )}
        </div>
        <p className={`mt-1.5 px-1 text-[10px] text-neutral-400 ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'You' : 'GoodFoods'} · {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </article>
  );
}
