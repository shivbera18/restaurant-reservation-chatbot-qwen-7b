import React from 'react';
import { Cpu, RotateCcw, UtensilsCrossed, Ticket } from 'lucide-react';
import type { SystemConfig } from '../types';

interface HeaderProps {
  config: SystemConfig | null;
  activeReservationsCount: number;
  onOpenModelModal: () => void;
  onOpenExplorer: () => void;
  onOpenReservations: () => void;
  onResetChat: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeReservationsCount,
  onOpenModelModal,
  onOpenExplorer,
  onOpenReservations,
  onResetChat,
  isResetting,
}) => {
  const isOnline = config?.status.ready ?? false;
  const activeProviderName = config?.use_mock
    ? 'DEMO (OFFLINE)'
    : (config?.provider_labels[config?.active_provider] || config?.active_provider || 'BACKEND');
  const activeModelName = config?.use_mock ? 'Mock Agent' : config?.active_model;

  return (
    <header className="sticky top-0 z-30 bg-[#F4EFE6] border-b-3 border-black px-4 py-3 shadow-neo">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-neo-yellow border-2 border-black rounded-neo-sm shadow-neo-sm flex items-center justify-center font-black text-xl select-none">
              🍽️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight uppercase leading-none">
                  GoodFoods<span className="text-neo-orange">.AI</span>
                </h1>
                <span className="bg-neo-purple text-xs font-mono font-bold px-1.5 py-0.5 border border-black shadow-neo-sm">
                  v{config?.app_version || '1.1.0'}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-700 mt-0.5 hidden sm:block">
                Autonomous Dining Concierge • 75 Locations
              </p>
            </div>
          </div>

          {/* Model Status Pill Badge for Mobile */}
          <button
            onClick={onOpenModelModal}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-white border-2 border-black rounded-neo-sm shadow-neo-sm text-xs font-mono font-bold"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border border-black ${
                isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{config?.active_provider?.toUpperCase()}</span>
          </button>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Active Model / Engine Pill Button */}
          <button
            onClick={onOpenModelModal}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black rounded-neo-sm shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all text-xs font-mono font-bold"
            title="Click to switch LLM Provider or Model"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full border border-black ${
                isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-400'
              }`}
            />
            <Cpu className="w-3.5 h-3.5" />
            <span className="uppercase">{activeProviderName}</span>
            <span className="text-gray-500 font-normal">/</span>
            <span className="text-black max-w-[140px] truncate">{activeModelName}</span>
          </button>

          {/* 75-Restaurant Directory Explorer Button */}
          <button
            onClick={onOpenExplorer}
            className="btn-neo bg-neo-blue px-3 py-1.5 text-xs flex items-center gap-1.5 text-black"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Directory</span>
            <span className="bg-white border border-black px-1 py-0.2 rounded-none text-[10px] font-mono font-black">
              {config?.stats.restaurants_count || 75}
            </span>
          </button>

          {/* Live Reservations Button */}
          <button
            onClick={onOpenReservations}
            className="btn-neo bg-neo-green px-3 py-1.5 text-xs flex items-center gap-1.5 text-black"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Bookings</span>
            {activeReservationsCount > 0 && (
              <span className="bg-black text-white px-1.5 py-0.2 text-[10px] font-mono font-black animate-bounce">
                {activeReservationsCount}
              </span>
            )}
          </button>

          {/* Reset Conversation Button */}
          <button
            onClick={onResetChat}
            disabled={isResetting}
            className="btn-neo bg-white hover:bg-neo-orange hover:text-white px-3 py-1.5 text-xs flex items-center gap-1.5 text-black disabled:opacity-50"
            title="Start a fresh conversation"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
