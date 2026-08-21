import React, { useState, useRef, useEffect } from 'react';
import { Send, UtensilsCrossed, Ticket, AlertTriangle, Sun, Moon, Paperclip } from 'lucide-react';
import type { ChatMessage, Restaurant, User } from '../types';
import { QuickBookingBar } from './QuickBookingBar';
import { ChatMessageBubble } from './ChatMessageBubble';
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
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
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
  theme,
  onToggleTheme,
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
    <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col overflow-hidden px-4 py-3 text-left sm:px-8 sm:py-5">
      <header className="mb-4 flex shrink-0 items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-sm font-semibold">Dining concierge</p>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Search, availability, and reservations in one conversation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenExplorer} className="hidden items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 sm:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <UtensilsCrossed className="h-3.5 w-3.5" /> {restaurantCount ?? 72} restaurants
          </button>
          <button onClick={onOpenReservations} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800" aria-label="Open reservations">
            <Ticket className="h-4 w-4" />
            {activeReservationsCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-semibold text-white">{activeReservationsCount}</span>}
          </button>
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800" aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          {!user && <button onClick={() => onOpenAuth('login')} className="hidden rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white sm:block dark:bg-white dark:text-neutral-950">Sign in</button>}
          {user && <button onClick={onLogout} className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300" title={`Signed in as ${user.name}. Click to log out`}>{user.name.charAt(0).toUpperCase()}</button>}
        </div>
      </header>

      {backendOffline && (
        <div className="mb-4 flex shrink-0 items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Backend offline. Start FastAPI on port 8000.</span>
          {onRetryConnection && <button onClick={onRetryConnection} className="font-semibold underline underline-offset-2">Retry</button>}
        </div>
      )}

      <div className="flex-1 space-y-5 overflow-y-auto pb-4 pr-1">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl py-10 sm:py-16">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">What are you planning?</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-500 dark:text-neutral-400">Describe the restaurant, occasion, area, or time you have in mind. I can take it from discovery through confirmation.</p>
            </div>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {QUICK_PROMPTS.slice(0, 4).map((item) => (
                <button key={item.label} onClick={() => onSendMessage(item.prompt)} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-800">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Stream */
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              copied={copiedId === msg.id}
              onCopy={() => handleCopyMessage(msg.id, msg.content)}
              onSelectRestaurant={onSelectRestaurant}
              onCancelReservation={onCancelReservation}
            />
          ))
        )}

        {loading && (
          <div className="animate-message-in flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-neutral-400" />
              <span className="ml-2 text-xs text-neutral-400">Checking availability</span>
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

      <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-300 bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,.06)] transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/10 dark:border-neutral-700 dark:bg-neutral-900">
          <input
            type="text"
            placeholder="Ask about restaurants or make a reservation…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full border-0 bg-transparent px-2 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50 dark:text-white"
          />
          <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Attachments are not available yet" title="Attachments coming soon"><Paperclip className="h-4 w-4" /></button>
              <span className="hidden sm:inline">GoodFoods can search and book for you</span>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex h-8 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Send <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
