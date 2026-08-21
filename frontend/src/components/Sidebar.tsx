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
  Sparkles,
  ChevronLeft,
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isOnline = config?.status.ready ?? false;
  const activeProviderName = config?.use_mock
    ? 'DEMO (OFFLINE)'
    : (config?.provider_labels[config?.active_provider] || config?.active_provider || 'BACKEND');
  const activeModelName = config?.use_mock ? 'Rule-based Agent' : config?.active_model;

  return (
    <>
      {/* ========================================================================= */}
      {/* Mobile Floating Top Bar (< md)                                            */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-2 z-30 mx-2 bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 px-3.5 py-2.5 shadow-neo dark:shadow-neo-dark rounded-neo-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center text-base rounded-neo-sm">
            🍽️
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight uppercase leading-none text-black dark:text-gray-100">
              GoodFoods<span className="text-neo-orange">.AI</span>
            </h1>
            <span className="text-[10px] font-mono font-bold text-black dark:text-gray-300">
              v{config?.app_version || '1.1.0'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle (Mobile) */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="w-8 h-8 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm text-black dark:text-gray-100 hover:bg-neo-yellow"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-neo-yellow" /> : <Moon className="w-4 h-4 text-black" />}
          </button>

          {/* Model Status Pill (Mobile) */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm text-[11px] font-mono font-black rounded-neo-sm text-black dark:text-gray-100"
          >
            <span
              className={`w-2 h-2 rounded-full border border-black dark:border-gray-600 ${
                isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
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

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
        />
      )}

      {/* Mobile Drawer Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-3 top-16 z-50 bg-[#F4EFE6] dark:bg-neo-surface border-3 border-black dark:border-gray-600 p-4 shadow-neo-xl dark:shadow-neo-xl-dark rounded-neo-lg space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-black dark:border-gray-600">
            <span className="font-mono font-black text-xs uppercase tracking-wider text-black dark:text-gray-100">
              Quick Navigation
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-neo-sm text-black dark:text-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              onOpenExplorer();
              setMobileMenuOpen(false);
            }}
            className="btn-neo bg-neo-blue text-black w-full py-2.5 px-3 text-xs flex items-center justify-between"
          >
            <span className="flex items-center gap-2 font-black uppercase">
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
            className="btn-neo bg-neo-green text-black w-full py-2.5 px-3 text-xs flex items-center justify-between"
          >
            <span className="flex items-center gap-2 font-black uppercase">
              <Ticket className="w-4 h-4" />
              <span>My Bookings</span>
            </span>
            {activeReservationsCount > 0 && (
              <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm animate-bounce">
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
            className="btn-neo bg-white dark:bg-neo-surface-alt text-black dark:text-gray-100 hover:bg-neo-orange hover:text-white w-full py-2.5 px-3 text-xs flex items-center gap-2 font-black uppercase"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>New Conversation</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Desktop Floating Hovering Sidebar (>= md)                                */}
      {/* Inspired by quiz-repo floating Neobrutalist architecture                  */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col fixed top-4 left-4 z-30 bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 shadow-neo-lg dark:shadow-neo-lg-dark rounded-neo-lg p-3.5 justify-between select-none transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72 lg:w-80'
        }`}
        style={{ height: 'calc(100vh - 32px)' }}
      >
        <div className="space-y-3.5">
          {/* Header Bar with Logo & Collapse Toggle */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-black dark:border-gray-700">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center text-lg rounded-neo-sm shrink-0">
                  🍽️
                </div>
                <div className="truncate">
                  <h1 className="font-black text-base tracking-tight uppercase leading-none text-black dark:text-gray-100">
                    GoodFoods<span className="text-neo-orange">.AI</span>
                  </h1>
                  <span className="text-[10px] font-mono font-bold text-black dark:text-gray-300 block mt-0.5">
                    Autonomous Concierge
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="w-9 h-9 bg-neo-yellow border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center text-lg rounded-neo-sm">
                  🍽️
                </div>
              </div>
            )}

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`w-8 h-8 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm hover:bg-neo-yellow text-black dark:text-gray-100 transition-all ${
                isCollapsed ? 'hidden' : 'shrink-0'
              }`}
            >
              <ChevronLeft className="w-4 h-4 text-black dark:text-gray-200" />
            </button>
          </div>

          {/* Quick Expand Button when Collapsed */}
          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="w-full py-1 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm flex items-center justify-center rounded-neo-sm hover:bg-neo-yellow text-black dark:text-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-black dark:text-gray-200" />
            </button>
          )}

          {/* AI Engine Status Card (Clickable to switch model) */}
          <div
            onClick={onOpenModelModal}
            className={`bg-[#FAF8F5] dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 shadow-neo-sm dark:shadow-neo-dark rounded-neo cursor-pointer hover:-translate-y-0.5 hover:shadow-neo transition-all group ${
              isCollapsed ? 'p-2 text-center' : 'p-3'
            }`}
            title="Click to switch LLM Provider or Model"
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between text-[11px] font-mono font-black text-black dark:text-gray-300 mb-1">
                  <span className="flex items-center gap-1.5 text-black dark:text-gray-100">
                    <Cpu className="w-3.5 h-3.5 text-neo-purple" />
                    <span>AI ENGINE</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full border border-black dark:border-gray-600 ${
                        isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-[10px] font-black text-black dark:text-gray-300">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                </div>
                <div className="truncate">
                  <span className="font-black text-xs uppercase text-black dark:text-gray-100 block truncate">
                    {activeProviderName}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-black dark:text-gray-300 truncate block">
                    {activeModelName}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Cpu className="w-4 h-4 text-neo-purple" />
                <span
                  className={`w-2 h-2 rounded-full border border-black dark:border-gray-600 ${
                    isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Primary Navigation Actions */}
          <div className="space-y-2">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-black uppercase text-black dark:text-gray-300 pl-1 block">
                Directory & Bookings
              </span>
            )}

            {/* Restaurant Directory Button */}
            <button
              onClick={onOpenExplorer}
              title="Browse 75 Restaurant Locations"
              className={`btn-neo bg-neo-blue text-black w-full flex items-center transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between p-2.5 text-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <span className="font-black uppercase tracking-tight truncate">Directory</span>
                )}
              </div>
              {!isCollapsed && (
                <span className="bg-white border border-black px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm text-black">
                  {config?.stats.restaurants_count || 75}
                </span>
              )}
            </button>

            {/* My Bookings Button */}
            <button
              onClick={onOpenReservations}
              title="View My Bookings & Reservations"
              className={`btn-neo bg-neo-green text-black w-full flex items-center transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5 relative'
                  : 'justify-between p-2.5 text-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <span className="font-black uppercase tracking-tight truncate">Bookings</span>
                )}
              </div>
              {!isCollapsed ? (
                activeReservationsCount > 0 ? (
                  <span className="bg-black text-white px-2 py-0.5 text-[10px] font-mono font-black rounded-neo-sm animate-bounce">
                    {activeReservationsCount}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-black text-black">0</span>
                )
              ) : (
                activeReservationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[9px] font-mono font-black rounded-full flex items-center justify-center">
                    {activeReservationsCount}
                  </span>
                )
              )}
            </button>

            {/* New Conversation Button */}
            <button
              onClick={onResetChat}
              disabled={isResetting}
              title="Start a fresh conversation"
              className={`btn-neo bg-white dark:bg-neo-surface-alt text-black dark:text-gray-100 hover:bg-neo-orange hover:text-white w-full flex items-center transition-all ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-start gap-2.5 p-2.5 text-xs'
              }`}
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${isResetting ? 'animate-spin' : ''}`} />
              {!isCollapsed && (
                <span className="font-black uppercase tracking-tight truncate">New Chat</span>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls & Info */}
        <div className="space-y-3 pt-3 border-t-2 border-dashed border-black dark:border-gray-700">
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`btn-neo bg-neo-canvas dark:bg-neo-surface-alt text-black dark:text-gray-100 w-full flex items-center transition-all ${
              isCollapsed ? 'justify-center p-2' : 'justify-between p-2 text-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-neo-yellow shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-black shrink-0" />
              )}
              {!isCollapsed && (
                <span className="font-bold text-[11px] text-black dark:text-gray-100">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-black text-black dark:text-gray-300 uppercase">
                {isDarkMode ? 'DARK' : 'LIGHT'}
              </span>
            )}
          </button>

          {!isCollapsed && (
            <div className="p-2.5 bg-[#FAF8F5] dark:bg-neo-surface-alt border border-black dark:border-gray-700 rounded-neo text-[10px] font-mono text-black dark:text-gray-300 space-y-0.5 text-left">
              <div className="flex items-center justify-between font-bold text-black dark:text-gray-100">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-neo-orange" />
                  <span>GoodFoods Engine</span>
                </span>
                <span className="text-[9px] font-mono font-black">v1.1</span>
              </div>
              <p className="text-[9px] font-medium leading-tight text-black dark:text-gray-300">
                75 locations across 12 metro districts
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
