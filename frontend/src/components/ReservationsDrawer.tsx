import React, { useState, useEffect, useMemo } from 'react';
import { X, Ticket, RefreshCw, AlertCircle, Search, Lock, LogIn } from 'lucide-react';
import type { Reservation, User } from '../types';
import { fetchReservations, cancelReservation, modifyReservation } from '../api';
import { ReservationTicket } from './ReservationTicket';

interface ReservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationUpdated?: () => void;
  initialReservations?: Reservation[];
  user: User | null;
  onOpenAuth: () => void;
}
export const ReservationsDrawer: React.FC<ReservationsDrawerProps> = ({
  isOpen,
  onClose,
  onReservationUpdated,
  initialReservations = [],
  user,
  onOpenAuth,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservations();
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReservations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialReservations.length > 0) {
      setReservations(initialReservations);
    }
  }, [initialReservations]);

  const handleCancelBooking = async (code: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      await cancelReservation(code);
      await loadReservations();
      if (onReservationUpdated) onReservationUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
    }
  };

  const handleModifyBooking = async (
    code: string,
    newDate: string,
    newTime: string,
    newPartySize: number,
    newRequests?: string
  ) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      await modifyReservation({
        confirmation_code: code,
        new_date: newDate,
        new_time: newTime,
        new_party_size: newPartySize,
        new_special_requests: newRequests,
      });
      await loadReservations();
      if (onReservationUpdated) onReservationUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update reservation');
      throw err;
    }
  };
  const filteredReservations = useMemo(() => {
    if (!search.trim()) return reservations;
    const q = search.toLowerCase();
    return reservations.filter(
      (r) =>
        r.confirmation_code.toLowerCase().includes(q) ||
        r.restaurant_name.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        (r.customer_phone && r.customer_phone.includes(q))
    );
  }, [reservations, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-3 border-black shadow-neo-xl rounded-neo-lg w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden text-left">
        {/* Header */}
        <div className="bg-neo-green border-b-3 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center rounded-neo-sm font-bold text-base">
              🎫
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black leading-none">
                My Bookings & Reservations
              </h2>
              <p className="text-xs font-bold text-black mt-0.5">
                {reservations.length} {reservations.length === 1 ? 'booking' : 'bookings'} on file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReservations}
              disabled={loading}
              aria-label="Refresh reservations"
              className="w-8 h-8 bg-white hover:bg-neo-yellow border-2 border-black flex items-center justify-center rounded-neo-sm text-black transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 bg-white hover:bg-neo-yellow border-2 border-black flex items-center justify-center rounded-neo-sm text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search filter bar if multiple bookings exist */}
        {reservations.length > 0 && (
          <div className="p-3 bg-white border-b-2 border-black">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code (e.g. GF-RES-...), venue, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-neo-canvas border-2 border-black rounded-neo-sm font-mono text-xs font-bold text-black placeholder:text-gray-600 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* User Account Overview Banner if Logged In */}
        {user && (
          <div className="p-3 bg-white border-b-2 border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-neo-yellow border-2 border-black rounded-neo-sm flex items-center justify-center font-black text-xs">
                👤
              </div>
              <div>
                <span className="font-black text-xs uppercase text-black block leading-none">
                  {user.name}
                </span>
                <span className="font-mono text-[10px] text-gray-700 block">
                  {user.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-neo-canvas border border-black px-2 py-0.5 text-[11px] font-mono font-bold text-black rounded-neo-sm">
                {reservations.filter((r) => r.status === 'confirmed').length} Active
              </span>
              <span className="bg-neo-yellow border border-black px-2 py-0.5 text-[11px] font-mono font-bold text-black rounded-neo-sm">
                {reservations.length} Total
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-neo-canvas space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-500 text-red-800 text-xs font-bold flex items-center gap-2 rounded-neo-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {!user ? (
            <div className="py-12 text-center">
              <div className="inline-block p-6 bg-white border-3 border-black rounded-neo shadow-neo max-w-sm">
                <div className="w-12 h-12 bg-neo-yellow border-2 border-black rounded-neo-sm flex items-center justify-center mx-auto mb-3 shadow-neo-sm">
                  <Lock className="w-6 h-6 text-black" />
                </div>
                <h3 className="font-black text-base uppercase text-black">Sign In to View & Manage Bookings</h3>
                <p className="text-xs text-black mt-1.5 leading-relaxed font-bold">
                  To protect your privacy and guarantee reservation security, only authenticated guests can view, modify, or cancel their bookings.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="btn-neo bg-neo-yellow hover:bg-neo-orange hover:text-white text-black px-4 py-2 text-xs mt-4 font-black uppercase flex items-center justify-center gap-1.5 w-full shadow-neo"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="py-16 text-center font-mono font-bold">
              <div className="inline-block p-4 bg-white border-2 border-black rounded-neo shadow-neo text-black">
                ⏳ Loading your reservations...
              </div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block p-6 bg-white border-3 border-black rounded-neo shadow-neo max-w-sm">
                <Ticket className="w-10 h-10 mx-auto text-black mb-2" />
                <p className="font-black text-base uppercase text-black">No Active Bookings</p>
                <p className="text-xs text-black mt-1 font-bold">
                  {search
                    ? 'No reservation matches your search query.'
                    : `Welcome, ${user.name}! You haven't booked any tables yet. Use the chat to book at any of our locations.`}
                </p>
                <button
                  onClick={onClose}
                  className="btn-neo bg-neo-yellow text-black px-4 py-1.5 text-xs mt-4 font-black uppercase"
                >
                  Start Booking
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((res) => (
                <ReservationTicket
                  key={res.id || res.confirmation_code}
                  reservation={res}
                  onCancel={handleCancelBooking}
                  onModify={handleModifyBooking}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t-2 border-black p-3 flex items-center justify-between text-xs font-mono text-black">
          <span>
            Showing {filteredReservations.length} of {reservations.length} bookings
          </span>
          <button
            onClick={onClose}
            className="btn-neo bg-black text-white border-black px-4 py-1 font-mono uppercase text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
