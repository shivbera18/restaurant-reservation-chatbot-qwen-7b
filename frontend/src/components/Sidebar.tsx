import React, { useState } from 'react';
import {
  Cpu,
  RotateCcw,
  UtensilsCrossed,
  Ticket,
  Moon,
  Sun,
  Menu,
  X,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { SystemConfig } from '../types';

interface SidebarProps {
  config: SystemConfig | null;
  activeReservationsCount: number;
  onOpenModelModal: () => void;
  onOpenExplorer: () => void;
  onOpenReservations: () => void;
  onResetChat: () => void;
  isResetting?: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  activeReservationsCount,
  onOpenModelModal,
  onOpenExplorer,
  onOpenReservations,
  onResetChat,
  isResetting,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOnline = config?.status.ready ?? false;
  const activeProviderName = config?.use_mock
    ? 'DEMO (OFFLINE)'
    : (config?.provider_labels[config?.active_provider] || config?.active_provider || 'BACKEND');
  const activeModelName = config?.use_mock ? 'Mock Agent' : config?.active_model;

  return (
    <>
      {/* ========================================================================= */}
      {/* Mobile Top Navigation Bar (< md)                                         */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-30 bg-[#F4EFE6] dark:bg-neo-surface border-b-3 border-black dark:border-gray-600 px-4 py-2.5 shadow-neo dark:shadow-neo-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center text-base rounded-neo-sm">
            🍽️
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight uppercase leading-none text-black dark:text-gray-100">
              GoodFoods<span className="text-neo-orange">.AI</span>
            </h1>
            <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400">
              v{config?.app_version || '1.1.0'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dark Mode Toggle (Mobile) */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="w-8 h-8 bg-white dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm text-black dark:text-gray-100 hover:bg-neo-yellow"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-neo-yellow" /> : <Moon className="w-4 h-4 text-black" />}
          </button>

          {/* Model Status Pill (Mobile) */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm text-[11px] font-mono font-bold rounded-neo-sm text-black dark:text-gray-100"
          >
            <span
              className={`w-2 h-2 rounded-full border border-black dark:border-gray-600 ${
                isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="truncate max-w-[80px]">{config?.active_provider?.toUpperCase()}</span>
          </button>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="w-8 h-8 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm text-black"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] z-20 bg-[#F4EFE6] dark:bg-neo-surface border-b-3 border-black dark:border-gray-600 p-4 shadow-neo-lg dark:shadow-neo-dark space-y-2">
          <button
            onClick={() => {
              onOpenExplorer();
              setMobileMenuOpen(false);
            }}
            className="btn-neo bg-neo-blue text-black w-full py-2 px-3 text-xs flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Restaurant Directory</span>
            </span>
            <span className="bg-white border border-black px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm">
              {config?.stats.restaurants_count || 75}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenReservations();
              setMobileMenuOpen(false);
            }}
            className="btn-neo bg-neo-green text-black w-full py-2 px-3 text-xs flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span>My Bookings</span>
            </span>
            {activeReservationsCount > 0 && (
              <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm">
                {activeReservationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onResetChat();
              setMobileMenuOpen(false);
            }}
            disabled={isResetting}
            className="btn-neo bg-white dark:bg-neo-surface-alt dark:text-gray-100 hover:bg-neo-orange hover:text-white w-full py-2 px-3 text-xs flex items-center gap-2 text-black"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>New Conversation</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Desktop Left Sidebar (>= md)                                             */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 shrink-0 h-screen sticky top-0 bg-[#F4EFE6] dark:bg-neo-surface border-r-3 border-black dark:border-gray-600 shadow-neo dark:shadow-neo-dark p-4 justify-between select-none z-20">
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="bg-white dark:bg-neo-surface-alt border-3 border-black dark:border-gray-600 p-3.5 shadow-neo dark:shadow-neo-dark rounded-neo">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center text-xl rounded-neo-sm">
                  🍽️
                </div>
                <div>
                  <h1 className="font-black text-lg tracking-tight uppercase leading-none text-black dark:text-gray-100">
                    GoodFoods<span className="text-neo-orange">.AI</span>
                  </h1>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mt-1">
                    Autonomous Concierge
                  </span>
                </div>
              </div>

              {/* Dark Mode Toggle Pill */}
              <button
                onClick={onToggleDarkMode}
                aria-label="Toggle dark mode"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="w-8 h-8 bg-neo-canvas dark:bg-neo-surface border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm hover:bg-neo-yellow dark:hover:bg-neo-yellow transition-all"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-neo-yellow dark:text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4 text-black" />
                )}
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-between text-[11px] font-mono">
              <span className="bg-neo-purple text-black text-[10px] font-bold px-1.5 py-0.5 border border-black dark:border-gray-600 rounded-neo-sm">
                v{config?.app_version || '1.1.0'}
              </span>
              <span className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neo-orange" /> 75 Locations
              </span>
            </div>
          </div>

          {/* AI Engine Status Card (Clickable to open ModelPicker) */}
          <div
            onClick={onOpenModelModal}
            className="bg-white dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-3 shadow-neo-sm dark:shadow-neo-dark rounded-neo cursor-pointer hover:-translate-y-0.5 hover:shadow-neo transition-all group"
            title="Click to switch LLM Provider or Model"
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-600 dark:text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-black dark:text-gray-200">
                <Cpu className="w-3.5 h-3.5 text-neo-purple" />
                <span>AI ENGINE</span>
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full border border-black dark:border-gray-600 ${
                    isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-[10px] text-gray-500">{isOnline ? 'READY' : 'OFFLINE'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="font-black text-xs uppercase text-black dark:text-gray-100 block">
                  {activeProviderName}
                </span>
                <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 truncate block">
                  {activeModelName}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors shrink-0" />
            </div>
          </div>

          {/* Primary Navigation Actions */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono font-bold uppercase text-gray-600 dark:text-gray-400 pl-1 block">
              Quick Actions
            </span>

            {/* Restaurant Directory Button */}
            <button
              onClick={onOpenExplorer}
              className="btn-neo bg-neo-blue text-black w-full p-2.5 text-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-white border border-black flex items-center justify-center rounded-neo-sm font-bold">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </div>
                <span className="font-black uppercase tracking-tight">Restaurant Directory</span>
              </div>
              <span className="bg-white border border-black px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm">
                {config?.stats.restaurants_count || 75}
              </span>
            </button>

            {/* My Bookings Button */}
            <button
              onClick={onOpenReservations}
              className="btn-neo bg-neo-green text-black w-full p-2.5 text-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-white border border-black flex items-center justify-center rounded-neo-sm font-bold">
                  <Ticket className="w-3.5 h-3.5" />
                </div>
                <span className="font-black uppercase tracking-tight">My Bookings</span>
              </div>
              {activeReservationsCount > 0 ? (
                <span className="bg-black text-white px-2 py-0.5 text-[11px] font-mono font-black rounded-neo-sm animate-bounce">
                  {activeReservationsCount}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-gray-700">0</span>
              )}
            </button>

            {/* Reset Conversation Button */}
            <button
              onClick={onResetChat}
              disabled={isResetting}
              className="btn-neo bg-white dark:bg-neo-surface-alt text-black dark:text-gray-100 hover:bg-neo-orange hover:text-white w-full p-2.5 text-xs flex items-center gap-2.5"
              title="Start a fresh conversation"
            >
              <div className="w-6 h-6 bg-neo-canvas dark:bg-neo-surface border border-black dark:border-gray-600 flex items-center justify-center rounded-neo-sm font-bold">
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              </div>
              <span className="font-black uppercase tracking-tight">New Conversation</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="bg-white dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-3 shadow-neo-sm dark:shadow-neo-dark rounded-neo text-left text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-black dark:text-gray-200">
            <Sparkles className="w-3.5 h-3.5 text-neo-orange" />
            <span>Neobrutalist Assistant</span>
          </div>
          <p className="text-[10px] font-sans text-gray-600 dark:text-gray-400 leading-relaxed">
            Multi-stage intent classification with dynamic MCP tool filtering across 10+ LLM providers.
          </p>
        </div>
      </aside>
    </>
  );
};
