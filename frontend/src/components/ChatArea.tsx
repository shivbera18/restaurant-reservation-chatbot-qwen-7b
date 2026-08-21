import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Loader2,
  Copy,
  Check,
  UtensilsCrossed,
  Ticket,
  User as UserIcon,
  LogIn,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { ChatMessage, Restaurant, User } from '../types';
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
  user: User | null;
  restaurantCount?: number;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenExplorer: () => void;
  onOpenReservations: () => void;
  activeReservationsCount: number;
  backendOffline?: boolean;
  onRetryConnection?: () => void;
}

const QUICK_PROMPTS = [
  { label: '🍕 Italian in Downtown', prompt: 'Can you find me a romantic Italian restaurant in Downtown?' },
  { label: '🍣 Japanese for 2', prompt: 'I need a top-rated Japanese spot for 2 people tomorrow night.' },
  { label: '🌶️ Thai on Aug 22 @ 9PM', prompt: 'Book a table for 4 at Thai Orchid Downtown on August 22, 2026 at 9:00 PM.' },
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
  restaurantCount,
  user,
  onOpenAuth,
  onLogout,
  onOpenExplorer,
  onOpenReservations,
  activeReservationsCount,
  backendOffline,
  onRetryConnection,
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
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full px-3 sm:px-6 py-3 overflow-hidden text-left">
      {/* Top Header Bar with Prominent Navigation & Sign In */}
      <header className="bg-white border-3 border-black shadow-neo rounded-neo px-3.5 py-2 mb-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black rounded-neo-sm flex items-center justify-center text-base font-black shadow-neo-sm">
            🍽️
          </div>
          <div>
            <h1 className="font-black text-sm uppercase tracking-tight text-black leading-none">
              GoodFoods<span className="text-neo-orange">.AI</span>
            </h1>
            <span className="font-mono text-[10px] font-bold text-gray-700 block mt-0.5">
              Autonomous Concierge
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Restaurant Explorer Shortcut */}
          <button
            type="button"
            onClick={onOpenExplorer}
            className="btn-neo bg-neo-blue text-black px-2.5 py-1 text-xs font-black uppercase hidden sm:flex items-center gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Directory ({restaurantCount ?? 75})</span>
          </button>

          {/* My Bookings Shortcut */}
          <button
            type="button"
            onClick={onOpenReservations}
            className="btn-neo bg-neo-green text-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1.5"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>My Bookings</span>
            {activeReservationsCount > 0 && (
              <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm">
                {activeReservationsCount}
              </span>
            )}
          </button>

          {/* Prominent User Sign In / Profile Pill */}
          {user ? (
            <div className="flex items-center gap-1.5 bg-neo-yellow border-2 border-black rounded-neo-sm shadow-neo-sm px-2.5 py-1">
              <UserIcon className="w-3.5 h-3.5 text-black" />
              <span className="font-black text-xs uppercase text-black max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                className="ml-1 text-[11px] font-mono font-black text-red-700 hover:text-black hover:underline"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="btn-neo bg-neo-yellow hover:bg-neo-orange hover:text-white text-black px-3 py-1 text-xs font-black uppercase flex items-center gap-1.5 shadow-neo-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>⚡ Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* Backend Offline Warning Banner if connection failed */}
      {backendOffline && (
        <div className="bg-neo-orange/20 border-3 border-black p-3 mb-3 rounded-neo shadow-neo flex items-center justify-between gap-2 text-xs font-bold text-black shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-neo-orange shrink-0" />
            <span>
              <strong>Backend Offline:</strong> FastAPI is not running on port 8000. Start backend with{' '}
              <code className="bg-white border border-black px-1.5 py-0.5 font-mono text-[11px]">uvicorn server:app --port 8000</code>.
            </span>
          </div>
          {onRetryConnection && (
            <button
              type="button"
              onClick={onRetryConnection}
              className="btn-neo bg-white hover:bg-neo-yellow text-black text-xs px-2.5 py-1 font-mono uppercase font-black shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Scrollable Message List Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-2">
        {messages.length === 0 ? (
          /* Welcome State */
          <div className="py-4 text-center max-w-2xl mx-auto space-y-4">
            {/* Hero Card */}
            <div className="bg-white border-3 border-black rounded-neo-lg p-6 shadow-neo-lg text-left relative overflow-hidden transition-colors">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-neo-yellow/30 rounded-full border-2 border-black select-none pointer-events-none" />

              <div className="inline-block bg-neo-yellow text-black border-2 border-black rounded-neo-sm px-2.5 py-0.5 text-xs font-mono font-black uppercase mb-3 shadow-neo-sm">
                ⭐ Autonomous Concierge
              </div>

              <h2 className="font-black text-2xl sm:text-3xl uppercase tracking-tight text-black leading-tight">
                GoodFoods Dining Concierge
              </h2>
              <p className="text-xs sm:text-sm font-bold text-black mt-2 leading-relaxed">
                Your AI concierge connected to <strong>{restaurantCount ?? 75} restaurant locations</strong> with real-time table availability, instant bookings, and reservation management.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 font-mono text-xs">
                <div className="bg-[#FAF8F5] border-2 border-black p-3 rounded-neo-sm">
                  <span className="font-black block text-xs uppercase text-black">🔍 Discover</span>
                  <span className="text-black text-[11px] font-bold mt-0.5 block">15 cuisines & 12 areas</span>
                </div>
                <div className="bg-[#FAF8F5] border-2 border-black p-3 rounded-neo-sm">
                  <span className="font-black block text-xs uppercase text-black">⚡ Instant Book</span>
                  <span className="text-black text-[11px] font-bold mt-0.5 block">Live table reservation</span>
                </div>
                <div className="bg-[#FAF8F5] border-2 border-black p-3 rounded-neo-sm">
                  <span className="font-black block text-xs uppercase text-black">🎫 Manage</span>
                  <span className="text-black text-[11px] font-bold mt-0.5 block">Instant modify & cancel</span>
                </div>
              </div>
            </div>

            {/* Quick Prompt Starters */}
            <div className="text-left space-y-1.5">
              <span className="text-xs font-mono font-black uppercase text-black block pl-1">
                🚀 Quick Action Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(item.prompt)}
                    className="btn-neo bg-white hover:bg-neo-yellow text-black hover:text-black text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 shadow-neo-sm"
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
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono font-black text-black">
                {msg.role === 'user' ? (
                  <>
                    <span>YOU</span>
                    <div className="w-4 h-4 bg-neo-yellow text-black border border-black flex items-center justify-center text-[10px] rounded-neo-sm">
                      👤
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-neo-green text-black border border-black flex items-center justify-center text-[10px] rounded-neo-sm">
                      🍽️
                    </div>
                    <span>GOODFOODS AI</span>
                  </>
                )}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] p-4 text-left border-3 border-black rounded-neo shadow-neo relative group transition-colors ${
                  msg.role === 'user' ? 'bg-neo-yellow text-black' : 'bg-white text-black'
                }`}
              >
                {/* Copy message button */}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  aria-label="Copy message text"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-neo-canvas border border-black p-1.5 rounded-neo-sm shadow-neo-sm text-black"
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-green-700" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-black" />
                  )}
                </button>

                {/* Markdown Content with Theme Awareness */}
                <div className="prose prose-sm max-w-none text-black prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-li:text-inherit prose-code:text-inherit font-sans leading-relaxed break-words">
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
                    <span className="text-[10px] font-mono font-black uppercase text-black block mb-1">
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
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-mono font-black text-black">
              <div className="w-4 h-4 bg-neo-green text-black border border-black flex items-center justify-center text-[10px] rounded-neo-sm">
                🍽️
              </div>
              <span>GOODFOODS AI</span>
            </div>
            <div className="bg-white border-3 border-black rounded-neo p-3 shadow-neo text-black flex items-center gap-2">
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
      <div className="pt-2 border-t-3 border-black bg-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message or use the Quick Answer bar above..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white border-3 border-black rounded-neo text-sm font-bold text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-neo-yellow disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="btn-neo bg-neo-yellow text-black hover:bg-neo-orange hover:text-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black uppercase flex items-center gap-1.5 shadow-neo disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
