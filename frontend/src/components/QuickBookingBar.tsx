import React, { useState } from 'react';
import { Users, Clock, Utensils, MapPin, ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';
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
  const [date, setDate] = useState('2026-08-22');
  const [time, setTime] = useState('9:00 PM');
  const [name, setName] = useState('Shiv');
  const [phone, setPhone] = useState('990-643-3115');

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
    <div className="bg-[#FFFDF7] border-2 border-black shadow-neo-sm p-2 mb-2 text-left text-xs font-sans transition-all">
      {/* Top Selector Strip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono font-bold">
          <span className="text-gray-500 uppercase flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="w-3 h-3 text-neo-orange" />
            <span>Quick Answer:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('party')}
            className={`px-2 py-0.5 border border-black shrink-0 ${
              activeTab === 'party' ? 'bg-neo-yellow text-black shadow-neo-sm font-black' : 'bg-white text-gray-700'
            }`}
          >
            👥 Guests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`px-2 py-0.5 border border-black shrink-0 ${
              activeTab === 'time' ? 'bg-neo-yellow text-black shadow-neo-sm font-black' : 'bg-white text-gray-700'
            }`}
          >
            ⏰ Time
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cuisine')}
            className={`px-2 py-0.5 border border-black shrink-0 ${
              activeTab === 'cuisine' ? 'bg-neo-yellow text-black shadow-neo-sm font-black' : 'bg-white text-gray-700'
            }`}
          >
            🍽️ Cuisine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('area')}
            className={`px-2 py-0.5 border border-black shrink-0 ${
              activeTab === 'area' ? 'bg-neo-yellow text-black shadow-neo-sm font-black' : 'bg-white text-gray-700'
            }`}
          >
            📍 Area
          </button>
        </div>

        {/* Toggle Expandable Direct Booking Form */}
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-neo bg-neo-blue text-black px-2 py-0.5 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
        >
          <span>⚡ Direct Booking Form</span>
          {isFormOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
                  onSendMessage(`Party size will be ${size} ${size === 1 ? 'person' : 'people'}.`)
                }
                className="btn-neo bg-white hover:bg-neo-yellow text-black px-2.5 py-1 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
              >
                <Users className="w-3 h-3 text-black" />
                <span>{size} {size === 1 ? 'Guest' : 'Guests'}</span>
              </button>
            ))}

          {activeTab === 'time' &&
            TIMES.map((t) => (
              <button
                key={t}
                type="button"
                disabled={loading}
                onClick={() => onSendMessage(`Time will be ${t}.`)}
                className="btn-neo bg-white hover:bg-neo-yellow text-black px-2.5 py-1 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
              >
                <Clock className="w-3 h-3 text-black" />
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
                className="btn-neo bg-white hover:bg-neo-yellow text-black px-2.5 py-1 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
              >
                <Utensils className="w-3 h-3 text-black" />
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
                className="btn-neo bg-white hover:bg-neo-yellow text-black px-2.5 py-1 text-[11px] font-mono font-bold shrink-0 flex items-center gap-1"
              >
                <MapPin className="w-3 h-3 text-black" />
                <span>{n}</span>
              </button>
            ))}
        </div>
      )}

      {/* Expandable Direct Booking Form */}
      {isFormOpen && (
        <form onSubmit={handleDirectSubmit} className="mt-2 pt-2 border-t-2 border-dashed border-black/40 space-y-2.5">
          <div className="bg-neo-canvas p-2 border border-black/40 text-[11px] font-mono">
            <strong>Target Venue:</strong>{' '}
            {selectedRestaurant ? (
              <span className="text-black font-bold">{selectedRestaurant.name} ({selectedRestaurant.neighborhood})</span>
            ) : (
              <span className="text-gray-600">Best-rated restaurant in selected cuisine</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Party Size */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-gray-600 mb-0.5">
                Guests:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-7 h-7 bg-white border-2 border-black font-mono font-black"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  className="w-12 h-7 text-center bg-white border-2 border-black font-mono font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(20, partySize + 1))}
                  className="w-7 h-7 bg-white border-2 border-black font-mono font-black"
                >
                  +
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-gray-600 mb-0.5">
                Date:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-7 px-2 bg-white border-2 border-black font-mono text-xs font-bold"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-gray-600 mb-0.5">
                Time:
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-7 px-1.5 bg-white border-2 border-black font-mono text-xs font-bold"
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
              <label className="block text-[10px] font-mono uppercase font-bold text-gray-600 mb-0.5">
                Your Name:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-7 px-2 bg-white border-2 border-black font-bold text-xs"
                required
              />
            </div>

            {/* Guest Phone */}
            <div>
              <label className="block text-[10px] font-mono uppercase font-bold text-gray-600 mb-0.5">
                Mobile Phone:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 990-643-3115"
                className="w-full h-7 px-2 bg-white border-2 border-black font-mono font-bold text-xs"
                required
              />
            </div>
          </div>

          {/* Submit Direct Booking */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-neo bg-white px-3 py-1 font-mono text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !phone.trim()}
              className="btn-neo bg-neo-green text-black px-4 py-1 font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-neo-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>⚡ Send Booking Details to Concierge</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
