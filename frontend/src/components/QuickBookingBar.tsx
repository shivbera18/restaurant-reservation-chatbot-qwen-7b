import React, { useState } from 'react';
import { Users, Clock, Utensils, MapPin, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';
import type { Restaurant } from '../types';

interface QuickBookingBarProps {
  onSendMessage: (text: string) => void;
  selectedRestaurant: Restaurant | null;
  loading: boolean;
}

const PARTY_SIZES = [1, 2, 4, 6, 8];
const TIMES = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];
const POPULAR_CUISINES = ['Italian', 'Thai', 'Japanese', 'Mexican', 'French', 'Steakhouse'];
const NEIGHBORHOODS = ['Downtown', 'Midtown', 'Uptown', 'Waterfront', 'Arts District'];

export const QuickBookingBar: React.FC<QuickBookingBarProps> = ({
  onSendMessage,
  selectedRestaurant,
  loading,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'party' | 'time' | 'date' | 'cuisine' | 'area'>('party');

  // Direct Booking Form State
  const [partySize, setPartySize] = useState(4);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('7:00 PM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const venuePart = selectedRestaurant
      ? `at ${selectedRestaurant.name}`
      : 'at the best-rated restaurant';
    const message = `Please book a table for ${partySize} people ${venuePart} on ${date} at ${time}. Name: ${name.trim()}, Phone: ${phone.trim()}.`;
    onSendMessage(message);
    setIsFormOpen(false);
  };

  return (
    <div className="bg-neo-card border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-2.5 mb-2 text-left text-xs font-sans transition-colors">
      {/* Top Selector Strip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono font-bold">
          <span className="text-neo-main uppercase flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-neo-orange" />
            <span>Quick Answer:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('party')}
            className={`px-2.5 py-1 border border-neutral-200 dark:border-neutral-700 rounded-lg font-bold shrink-0 transition-colors ${activeTab === 'party' ? 'bg-neo-yellow text-black shadow-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
          >
            👥 Guests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`px-2.5 py-1 border border-neutral-200 dark:border-neutral-700 rounded-lg font-bold shrink-0 transition-colors ${activeTab === 'time' ? 'bg-neo-yellow text-black shadow-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
          >
            ⏰ Time
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cuisine')}
            className={`px-2.5 py-1 border border-neutral-200 dark:border-neutral-700 rounded-lg font-bold shrink-0 transition-colors ${activeTab === 'cuisine' ? 'bg-neo-yellow text-black shadow-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
          >
            🍽️ Cuisine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('area')}
            className={`px-2.5 py-1 border border-neutral-200 dark:border-neutral-700 rounded-lg font-bold shrink-0 transition-colors ${activeTab === 'area' ? 'bg-neo-yellow text-black shadow-sm' : 'bg-neo-surface text-neo-main hover:bg-neo-yellow hover:text-black'}`}
          >
            📍 Area
          </button>
        </div>

        {/* Toggle Expandable Direct Booking Form */}
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-neo bg-neo-blue text-black px-2.5 py-1 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
        >
          <span>⚡ Direct Booking</span>
          {isFormOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Dynamic Answer Chips based on Active Tab */}
      {!isFormOpen && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 text-xs">
          {activeTab === 'party' &&
            PARTY_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                disabled={loading}
                onClick={() =>
                  onSendMessage(`I need a table for ${size} ${size === 1 ? 'person' : 'people'}.`)
                }
                className="btn-neo bg-neo-canvas hover:bg-neo-yellow hover:text-black text-black px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Users className="w-3 h-3 text-neo-orange" />
                <span>{size} {size === 1 ? 'Guest' : 'Guests'}</span>
              </button>
            ))}

          {activeTab === 'time' &&
            TIMES.map((t) => (
              <button
                key={t}
                type="button"
                disabled={loading}
                onClick={() => onSendMessage(`I would prefer a reservation at ${t}.`)}
                className="btn-neo bg-neo-canvas hover:bg-neo-yellow hover:text-black text-black px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Clock className="w-3 h-3 text-neo-orange" />
                <span>{t}</span>
              </button>
            ))}

          {activeTab === 'cuisine' &&
            POPULAR_CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                disabled={loading}
                onClick={() => onSendMessage(`I want to eat ${c} food.`)}
                className="btn-neo bg-neo-canvas hover:bg-neo-yellow hover:text-black text-black px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Utensils className="w-3 h-3 text-neo-orange" />
                <span>{c}</span>
              </button>
            ))}

          {activeTab === 'area' &&
            NEIGHBORHOODS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={loading}
                onClick={() => onSendMessage(`I prefer a restaurant in ${n}.`)}
                className="btn-neo bg-neo-canvas hover:bg-neo-yellow hover:text-black text-black px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <MapPin className="w-3 h-3 text-neo-orange" />
                <span>{n}</span>
              </button>
            ))}
        </div>
      )}

      {/* Expandable Direct Booking Form */}
      {isFormOpen && (
        <form onSubmit={handleDirectSubmit} className="mt-2.5 pt-2.5 border-t-2 border-dashed border-black space-y-2.5">
          <div className="bg-neo-surface p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[11px] font-mono text-neo-main">
            <strong>Target Venue:</strong>{' '}
            {selectedRestaurant ? (
              <span className="text-neo-main font-bold">{selectedRestaurant.name} ({selectedRestaurant.neighborhood || 'Downtown'})</span>
            ) : (
              <span className="text-neo-main">Best-rated restaurant in selected cuisine</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Party Size */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-neo-main mb-0.5">
                Guests:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-7 h-7 bg-neo-surface text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono font-black"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  className="w-12 h-7 text-center bg-neo-card text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(20, partySize + 1))}
                  className="w-7 h-7 bg-neo-surface text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono font-black"
                >
                  +
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-neo-main mb-0.5">
                Date:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 bg-neo-card text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs font-bold"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-neo-main mb-0.5">
                Time:
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-7 px-1.5 bg-neo-card text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs font-bold"
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Guest Name */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-neo-main mb-0.5">
                Your Name:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-7 px-2 bg-neo-card text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs placeholder:text-neo-muted font-bold"
                required
              />
            </div>

            {/* Guest Phone */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-neo-main mb-0.5">
                Mobile Phone:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 990-643-3115"
                className="w-full h-7 px-2 bg-neo-card text-neo-main border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs placeholder:text-neo-muted font-bold"
                required
              />
            </div>
          </div>

          {/* Submit Direct Booking */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-neo bg-neo-card text-neo-main px-3 py-1 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-neo bg-neo-yellow text-black hover:bg-neo-orange hover:text-white px-4 py-1 font-mono text-xs font-black uppercase flex items-center gap-1 shadow-sm"
            >
              <Zap className="w-3 h-3" />
              <span>Book Table Now</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
