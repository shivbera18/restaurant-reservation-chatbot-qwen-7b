import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, Copy, Check } from 'lucide-react';
import type { ChatMessage, Restaurant } from '../types';
import { RestaurantCard } from './RestaurantCard';
import { ReservationTicket } from './ReservationTicket';
import { ToolCallBadge } from './ToolCallBadge';
import { QuickBookingBar } from './QuickBookingBar';

interface ChatAreaProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onCancelReservation?: (code: string) => Promise<void>;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  selectedRestaurant?: Restaurant | null;
}

const QUICK_PROMPTS = [
  { label: '🍕 Italian in Downtown', prompt: 'Can you find me a romantic Italian restaurant in Downtown?' },
  { label: '🍣 Japanese for 2', prompt: 'I need a top-rated Japanese spot for 2 people tomorrow night.' },
  { label: '🌶️ Thai on Aug 22 @ 9PM', prompt: 'Book a table for 4 at Thai Orchid Downtown on August 22, 2026 at 9:00 PM. Name: Shiv, Phone: 990-643-3115.' },
  { label: '🍸 Rooftop with Cocktails', prompt: 'What restaurants have great outdoor seating or a full bar?' },
  { label: '📋 Lookup Booking', prompt: 'Can you look up my existing reservation details?' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loading,
  onSendMessage,
  onCancelReservation,
  onSelectRestaurant,
  selectedRestaurant,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full px-3 sm:px-5 py-3 overflow-hidden">
      {/* Scrollable Message List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="py-4 text-center max-w-2xl mx-auto space-y-4">
            {/* Hero Card */}
            <div className="bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo p-6 shadow-neo-lg dark:shadow-neo-dark text-left relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-neo-yellow/30 rounded-full border-2 border-black dark:border-gray-600/10 select-none pointer-events-none" />

              <div className="inline-block bg-neo-yellow border-2 border-black dark:border-gray-600 rounded-neo-sm px-2.5 py-0.5 text-xs font-mono font-black uppercase mb-3 shadow-neo dark:shadow-neo-dark-sm dark:shadow-neo dark:shadow-neo-dark-sm-dark">
                ⭐ Autonomous Concierge
              </div>

              <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-black dark:text-gray-100 leading-tight">
                GoodFoods Dining Concierge
              </h2>
              <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                Your AI concierge connected to <strong>75 restaurant locations</strong> with real-time table availability, instant bookings, and customized dining recommendations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 font-mono text-xs">
                <div className="bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-2.5">
                  <span className="font-black block text-xs uppercase text-black dark:text-gray-100">🔍 Discover</span>
                  <span className="text-gray-600 dark:text-gray-400 text-[11px]">15 cuisines & 12 areas</span>
                </div>
                <div className="bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-2.5">
                  <span className="font-black block text-xs uppercase text-black dark:text-gray-100">⚡ Instant Book</span>
                  <span className="text-gray-600 dark:text-gray-400 text-[11px]">Live table reservation</span>
                </div>
                <div className="bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-2.5">
                  <span className="font-black block text-xs uppercase text-black dark:text-gray-100">🎫 Manage</span>
                  <span className="text-gray-600 dark:text-gray-400 text-[11px]">Instant modify & cancel</span>
                </div>
              </div>
            </div>

            {/* Quick Prompt Starters */}
            <div className="text-left space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase text-gray-600 dark:text-gray-400 block pl-1">
                🚀 Quick Action Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(item.prompt)}
                    className="btn-neo bg-white dark:bg-neo-surface hover:bg-neo-yellow text-black dark:text-gray-100 text-xs px-3 py-1.5 font-bold flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Stream */
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Role Header Avatar Pill */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-400">
                {msg.role === 'user' ? (
                  <>
                    <span>YOU</span>
                    <div className="w-4 h-4 bg-neo-yellow border border-black dark:border-gray-600 flex items-center justify-center text-[10px]">
                      👤
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-neo-green border border-black dark:border-gray-600 flex items-center justify-center text-[10px]">
                      🍽️
                    </div>
                    <span>GOODFOODS AI</span>
                  </>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-4 text-left border-3 border-black dark:border-gray-600 rounded-neo shadow-neo dark:shadow-neo-dark relative group ${
                  msg.role === 'user'
                    ? 'bg-neo-yellow text-black dark:text-gray-100'
                    : 'bg-white dark:bg-neo-surface text-gray-900 dark:text-gray-100'
                }`}
              >
                {/* Copy message button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  aria-label="Copy message text"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neo-canvas dark:bg-neo-surface-alt border border-black dark:border-gray-600 p-1 text-gray-700 dark:text-gray-300 hover:bg-white dark:bg-neo-surface"
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-green-700" />
                  ) : (
                    <Copy className="w-3 h-3 text-black dark:text-gray-100" />
                  )}
                </button>

                {/* Markdown Content */}
                <div className="prose prose-sm max-w-none text-black dark:text-gray-100 font-sans leading-relaxed break-words">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Collapsible Tool Calls Badge */}
                {msg.tool_results && msg.tool_results.length > 0 && (
                  <ToolCallBadge toolResults={msg.tool_results} />
                )}

                {/* Selected Restaurant Card if present */}
                {msg.selected_restaurant && (
                  <div className="mt-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">
                      Featured Venue:
                    </span>
                    <RestaurantCard
                      restaurant={msg.selected_restaurant}
                      onSelect={onSelectRestaurant}
                    />
                  </div>
                )}

                {/* Digital Reservation Pass Ticket if booking occurred */}
                {msg.created_reservation && (
                  <div className="mt-3">
                    <ReservationTicket
                      reservation={msg.created_reservation}
                      onCancel={onCancelReservation}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Thinking Indicator */}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 bg-neo-green border border-black dark:border-gray-600 flex items-center justify-center text-[10px]">
                🍽️
              </div>
              <span>GOODFOODS AI</span>
            </div>
            <div className="bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo p-3 shadow-neo dark:shadow-neo-dark flex items-center gap-2.5 font-mono text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-neo-orange" />
              <span>Checking tables & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Quick Answer & Booking Form Bar */}
      <QuickBookingBar
        onSendMessage={onSendMessage}
        selectedRestaurant={selectedRestaurant || null}
        loading={loading}
      />

      {/* Sticky Bottom Input Bar */}
      <div className="pt-2 border-t-3 border-black dark:border-gray-600 bg-[#F4EFE6] dark:bg-neo-dark">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message or use the Quick Answer bar above..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo shadow-neo dark:shadow-neo-dark font-bold text-xs sm:text-sm text-black dark:text-gray-100 placeholder:text-gray-500 dark:text-gray-400 focus:outline-none focus:bg-[#FFFDE8] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="btn-neo bg-neo-yellow hover:bg-neo-orange hover:text-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
