import React, { useState } from 'react';
import {
  RotateCcw,
  UtensilsCrossed,
  Ticket,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogIn,
  LogOut,
  Settings,
  Sun,
  Moon,
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
  theme?: 'light' | 'dark' | 'system';
  onToggleTheme?: () => void;
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
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ========================================================================= */}
      {/* Mobile Floating Top Bar (< md)                                            */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-2 z-30 mx-2 bg-neo-card border-3 border-black px-3.5 py-2.5 shadow-neo rounded-neo-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neo-yellow border-2 border-black shadow-neo-sm flex items-center justify-center text-base rounded-neo-sm">
            🍽️
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight uppercase leading-none text-neo-main">
              GoodFoods<span className="text-neo-orange">.AI</span>
            </h1>
            <span className="text-[10px] font-mono font-bold text-neo-muted">
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

          {/* Theme Toggle (Mobile) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-8 h-8 bg-neo-card border-2 border-black shadow-neo-sm flex items-center justify-center rounded-neo-sm text-neo-main"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-neo-yellow" /> : <Moon className="w-3.5 h-3.5 text-black" />}
            </button>
          )}
          {/* Model Settings Shortcut (Mobile) */}
          <button
            onClick={onOpenModelModal}
            aria-label="AI engine settings"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neo-canvas border-2 border-black shadow-neo-sm text-[11px] font-mono font-black text-neo-main rounded-neo-sm"
          >
            <Settings className="w-3.5 h-3.5" />
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
            <span className="font-mono font-black text-xs uppercase tracking-wider text-neo-main">
              Quick Navigation
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 hover:bg-black/10 rounded-neo-sm text-neo-main"
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
            <span className="bg-neo-card border border-black px-1.5 py-0.5 text-[10px] font-mono font-black rounded-neo-sm">
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
            className="btn-neo bg-neo-card text-neo-main hover:bg-neo-orange hover:text-white w-full py-2.5 px-3 text-xs flex items-center gap-2 font-black uppercase"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>New Conversation</span>
          </button>
        </div>
      )}

      {/* Desktop application navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 md:flex dark:border-neutral-800 dark:bg-neutral-950 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">GoodFoods</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">AI Concierge</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={onToggleCollapse} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Collapse sidebar">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button onClick={onToggleCollapse} className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Expand sidebar">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {!isCollapsed && <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Workspace</p>}
          <button onClick={onOpenExplorer} title="Restaurant directory" className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <UtensilsCrossed className="h-4 w-4 shrink-0" />
            {!isCollapsed && <><span className="flex-1 text-left">Restaurants</span><span className="text-xs text-neutral-400">{config?.stats.restaurants_count ?? 72}</span></>}
          </button>
          <button onClick={onOpenReservations} title="My reservations" className={`relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Ticket className="h-4 w-4 shrink-0" />
            {!isCollapsed && <><span className="flex-1 text-left">Reservations</span>{activeReservationsCount > 0 && <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-neutral-950">{activeReservationsCount}</span>}</>}
            {isCollapsed && activeReservationsCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500" />}
          </button>
          <button onClick={onResetChat} disabled={isResetting} title="New conversation" className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <RotateCcw className={`h-4 w-4 shrink-0 ${isResetting ? 'animate-spin' : ''}`} />
            {!isCollapsed && <span>New conversation</span>}
          </button>
        </nav>

        <div className="space-y-1 border-t border-neutral-200 p-3 dark:border-neutral-800">
          <button onClick={onOpenModelModal} title="AI engine settings" className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Settings className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>AI settings</span>}
          </button>
          {onToggleTheme && (
            <button onClick={onToggleTheme} title="Toggle color theme" className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
              {!isCollapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            </button>
          )}

          {user ? (
            <div className={`mt-2 flex items-center rounded-lg border border-neutral-200 p-2 dark:border-neutral-800 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">{user.name.charAt(0).toUpperCase()}</div>
              {!isCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user.name}</p><p className="truncate text-[11px] text-neutral-500">{user.email}</p></div>}
              {!isCollapsed && <button onClick={onLogout} className="text-neutral-400 hover:text-red-600" aria-label="Log out"><LogOut className="h-4 w-4" /></button>}
            </div>
          ) : (
            <button onClick={() => onOpenAuth('login')} className={`mt-2 flex w-full items-center rounded-lg bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <LogIn className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign in</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
