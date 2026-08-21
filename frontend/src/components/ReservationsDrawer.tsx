import React, { useState, useEffect, useMemo } from 'react';
import { X, Ticket, RefreshCw, AlertCircle, Search } from 'lucide-react';
import type { Reservation } from '../types';
import { fetchReservations, cancelReservation } from '../api';
import { ReservationTicket } from './ReservationTicket';

interface ReservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationUpdated?: () => void;
  initialReservations?: Reservation[];
}

export const ReservationsDrawer: React.FC<ReservationsDrawerProps> = ({
  isOpen,
  onClose,
  onReservationUpdated,
  initialReservations = [],
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
    await cancelReservation(code);
    await loadReservations();
    if (onReservationUpdated) onReservationUpdated();
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
      <div className="bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 shadow-neo-xl dark:shadow-neo-xl-dark rounded-neo-lg w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden text-left">
        {/* Header */}
        <div className="bg-neo-green border-b-3 border-black dark:border-gray-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center rounded-neo-sm font-bold text-base">
              🎫
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-black leading-none">
                My Bookings & Reservations
              </h2>
              <p className="text-xs font-bold text-gray-900 mt-0.5">
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
          <div className="p-3 bg-white dark:bg-neo-surface border-b-2 border-black dark:border-gray-600">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code (e.g. GF-RES-...), venue, name, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 rounded-neo-sm font-mono text-xs font-bold text-black dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-neo-canvas dark:bg-neo-dark space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2 rounded-neo-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center font-mono font-bold">
              <div className="inline-block p-4 bg-white dark:bg-neo-surface border-2 border-black dark:border-gray-600 rounded-neo shadow-neo dark:shadow-neo-dark text-black dark:text-gray-100">
                ⏳ Loading reservations...
              </div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-block p-6 bg-white dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo shadow-neo dark:shadow-neo-dark max-w-sm">
                <Ticket className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="font-black text-base uppercase text-black dark:text-gray-100">No Bookings Found</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {search
                    ? 'No reservation matches your search query.'
                    : "You haven't made any reservations yet. Use the chat to book a table at any of our 75 locations!"}
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-neo-surface border-t-2 border-black dark:border-gray-600 p-3 flex items-center justify-between text-xs font-mono text-gray-600 dark:text-gray-300">
          <span>
            Showing {filteredReservations.length} of {reservations.length} bookings
          </span>
          <button
            onClick={onClose}
            className="btn-neo bg-black dark:bg-neutral-800 text-white border-black dark:border-gray-600 px-4 py-1 font-mono uppercase text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
