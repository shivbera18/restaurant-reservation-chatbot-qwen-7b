import React, { useState, useEffect } from 'react';
import { Lock, User, Mail, Phone, X, ArrowRight, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../api';
import type { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser({ email: email.trim(), password });
        onAuthSuccess(res.user);
      } else {
        const res = await registerUser({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
        onAuthSuccess(res.user);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-neo-card border-3 border-black shadow-neo-xl rounded-neo-lg w-full max-w-md my-auto overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-neo-yellow border-b-3 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center rounded-neo-sm text-lg font-bold shadow-neo-sm">
              🔐
            </div>
            <div>
              <h2 id="auth-modal-title" className="font-black text-lg uppercase tracking-tight text-black leading-none">
                {mode === 'login' ? 'Customer Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs font-bold text-black mt-0.5">
                {mode === 'login' ? 'Manage your personal dining bookings' : 'Join GoodFoods to track & manage reservations'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 bg-white hover:bg-neo-orange hover:text-white border-2 border-black flex items-center justify-center rounded-neo-sm text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 border-b-2 border-black bg-neo-surface text-xs font-mono font-black">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 text-center uppercase tracking-wider transition-colors ${
              mode === 'login'
                ? 'bg-neo-card text-neo-main border-b-2 border-black font-black'
                : 'text-neo-muted hover:bg-neo-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 text-center uppercase tracking-wider transition-colors ${
              mode === 'register'
                ? 'bg-neo-card text-neo-main border-b-2 border-black font-black'
                : 'text-neo-muted hover:bg-neo-surface'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 bg-neo-card text-left">
          {error && (
            <div className="p-2.5 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-bold rounded-neo-sm flex items-center gap-2">
              <span>⚠️ {error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono font-black uppercase text-neo-main mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Shiva Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-sans text-xs font-bold placeholder:text-neo-muted focus:outline-none focus:bg-neo-card"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-black uppercase text-neo-main mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-mono text-xs font-bold placeholder:text-neo-muted focus:outline-none focus:bg-neo-card"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-black uppercase text-neo-main mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-mono text-xs font-bold placeholder:text-neo-muted focus:outline-none focus:bg-neo-card"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono font-black uppercase text-neo-main mb-1">
                Mobile Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="e.g. +91 990-643-3115"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neo-surface text-neo-main border-2 border-black rounded-neo-sm font-mono text-xs font-bold placeholder:text-neo-muted focus:outline-none focus:bg-neo-card"
                />
              </div>
            </div>
          )}


          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-neo bg-neo-yellow hover:bg-neo-orange hover:text-white text-black w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-neo"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In & Access Bookings' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch Prompt */}
          <div className="text-center pt-1 text-xs font-mono">
            {mode === 'login' ? (
              <p className="text-neo-main font-bold">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-neo-orange font-black underline hover:text-black"
                >
                  Create one here
                </button>
              </p>
            ) : (
              <p className="text-neo-main font-bold">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-neo-orange font-black underline hover:text-black"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
