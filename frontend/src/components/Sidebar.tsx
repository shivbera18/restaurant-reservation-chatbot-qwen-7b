import React, { useState } from 'react';
import {
  Cpu,
  RotateCcw,
  UtensilsCrossed,
  Ticket,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { SystemConfig, User } from '../types';

interface SidebarProps {
  config: SystemConfig | null;
  activeReservationsCount: number;
  onOpenModelModal: () => void;
  onOpenExplorer: () => void;
  onOpenReservations: () => void;
  onResetChat: () => void;
  isResetting?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  activeReservationsCount,
  onOpenModelModal,
  onOpenExplorer,
  onOpenReservations,
  onResetChat,
  isResetting,
  isCollapsed,
  onToggleCollapse,
  user,
  onOpenAuth,
  onLogout,
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
      <header className="md:hidden sticky top-2 z-30 mx-2 bg-white border-3 border-black px-3.5 py-2.5 shadow-neo rounded-neo-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center text-base rounded-neo-sm">
            🍽️
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight uppercase leading-none text-black">
              GoodFoods<span className="text-neo-orange">.AI</span>
            </h1>
            <span className="text-[10px] font-mono font-bold text-black">
              v{config?.app_version || '1.1.0'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auth Status / Login (Mobile) */}
          {user ? (
            <button
              onClick={onLogout}
              aria-label="Log out"
              title={`Logged in as ${user.name}. Click to log out`}
              className="flex items-center gap-1 px-2 py-1 bg-neo-yellow border-2 border-black shadow-neo-sm text-[11px] font-mono font-black rounded-neo-sm text-black"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              aria-label="Log in"
              className="flex items-center gap-1 px-2 py-1 bg-neo-yellow border-2 border-black shadow-neo-sm text-[11px] font-mono font-black rounded-neo-sm text-black hover:bg-neo-orange hover:text-white"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
          {/* Model Status Pill (Mobile) */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neo-canvas border-2 border-black shadow-neo-sm text-[11px] font-mono font-black rounded-neo-sm text-black"
          >
            <span
              className={`w-2 h-2 rounded-full border border-black ${
                isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="truncate max-w-[80px]">{config?.active_provider?.toUpperCase()}</span>
          </button>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open navigation menu"
            className="w-8 h-8 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center rounded-neo-sm text-black"
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
        <div className="md:hidden fixed inset-x-3 top-16 z-50 bg-[#F4EFE6] border-3 border-black p-4 shadow-neo-xl rounded-neo-lg space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-black">
            <span className="font-mono font-black text-xs uppercase tracking-wider text-black">
              Quick Navigation
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 hover:bg-black/10 rounded-neo-sm text-black"
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
            className="btn-neo bg-white text-black hover:bg-neo-orange hover:text-white w-full py-2.5 px-3 text-xs flex items-center gap-2 font-black uppercase"
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
        className={`hidden md:flex flex-col fixed top-4 left-4 z-30 bg-white border-3 border-black shadow-neo-lg rounded-neo-lg p-3.5 justify-between select-none transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72 lg:w-80'
        }`}
        style={{ height: 'calc(100vh - 32px)' }}
      >
        <div className="space-y-3.5">
          {/* Header Bar with Logo & Collapse Toggle */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-black">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center text-lg rounded-neo-sm shrink-0">
                  🍽️
                </div>
                <div className="truncate">
                  <h1 className="font-black text-base tracking-tight uppercase leading-none text-black">
                    GoodFoods<span className="text-neo-orange">.AI</span>
                  </h1>
                  <span className="text-[10px] font-mono font-bold text-black block mt-0.5">
                    Autonomous Concierge
                  </span>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="w-9 h-9 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center text-lg rounded-neo-sm">
                  🍽️
                </div>
              </div>
            )}

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`w-8 h-8 bg-neo-canvas border-2 border-black shadow-neo-sm flex items-center justify-center rounded-neo-sm hover:bg-neo-yellow text-black transition-all ${
                isCollapsed ? 'hidden' : 'shrink-0'
              }`}
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Quick Expand Button when Collapsed */}
          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="w-full py-1 bg-neo-canvas border-2 border-black shadow-neo-sm flex items-center justify-center rounded-neo-sm hover:bg-neo-yellow text-black"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          )}

          {/* AI Engine Status Card (Clickable to switch model) */}
          <div
            onClick={onOpenModelModal}
            className={`bg-[#FAF8F5] border-2 border-black shadow-neo-sm rounded-neo cursor-pointer hover:-translate-y-0.5 hover:shadow-neo transition-all group ${
              isCollapsed ? 'p-2 text-center' : 'p-3'
            }`}
            title="Click to switch LLM Provider or Model"
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between text-[11px] font-mono font-black text-black mb-1">
                  <span className="flex items-center gap-1.5 text-black">
                    <Cpu className="w-3.5 h-3.5 text-neo-purple" />
                    <span>AI ENGINE</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full border border-black ${
                        isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-[10px] font-black text-black">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                </div>
                <div className="truncate">
                  <span className="font-black text-xs uppercase text-black block truncate">
                    {activeProviderName}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-black truncate block">
                    {activeModelName}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Cpu className="w-4 h-4 text-neo-purple" />
                <span
                  className={`w-2 h-2 rounded-full border border-black ${
                    isOnline ? 'bg-neo-green animate-pulse' : 'bg-red-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Primary Navigation Actions */}
          <div className="space-y-2">
            {!isCollapsed && (
              <span className="text-[10px] font-mono font-black uppercase text-black pl-1 block">
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

            {/* Account / Login Action Button */}
            {user ? (
              <div
                className={`p-2.5 bg-neo-yellow/20 border-2 border-black shadow-neo-sm rounded-neo text-left ${
                  isCollapsed ? 'p-2 text-center' : ''
                }`}
              >
                {!isCollapsed ? (
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 bg-neo-yellow border border-black flex items-center justify-center rounded-neo-sm shrink-0 font-black text-xs">
                        👤
                      </div>
                      <div className="truncate">
                        <span className="font-black text-xs text-black block truncate leading-none">
                          {user.name}
                        </span>
                        <span className="text-[10px] font-mono text-black truncate block mt-0.5">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      title="Sign out of your account"
                      className="p-1 hover:bg-red-200 border border-black rounded-neo-sm shrink-0 text-black"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-700" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onLogout}
                    title={`Logged in as ${user.name}. Click to log out`}
                    className="mx-auto"
                  >
                    <UserIcon className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                title="Sign in to view and manage reservations"
                className={`btn-neo bg-neo-yellow text-black hover:bg-neo-orange hover:text-white w-full flex items-center transition-all ${
                  isCollapsed
                    ? 'justify-center p-2.5'
                    : 'justify-start gap-2.5 p-2.5 text-xs'
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <span className="font-black uppercase tracking-tight truncate">Sign In / Sign Up</span>
                )}
              </button>
            )}

            {/* New Conversation Button */}
            <button
              onClick={onResetChat}
              disabled={isResetting}
              title="Start a fresh conversation"
              className={`btn-neo bg-white text-black hover:bg-neo-orange hover:text-white w-full flex items-center transition-all ${
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

        <div className="space-y-3 pt-3 border-t-2 border-dashed border-black">

          {!isCollapsed && (
            <div className="p-2.5 bg-[#FAF8F5] border border-black rounded-neo text-[10px] font-mono text-black space-y-0.5 text-left">
              <div className="flex items-center justify-between font-bold text-black">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-neo-orange" />
                  <span>GoodFoods Engine</span>
                </span>
                <span className="text-[9px] font-mono font-black">v1.1</span>
              </div>
              <p className="text-[9px] font-medium leading-tight text-black">
                75 locations across 12 metro districts
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
