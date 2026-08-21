import React, { useState } from 'react';
import { Ticket, Calendar, Clock, Users, Phone, User, Check, Copy, XCircle, AlertTriangle } from 'lucide-react';
import type { Reservation } from '../types';

interface ReservationTicketProps {
  reservation: Reservation;
  onCancel?: (code: string) => Promise<void>;
}

export const ReservationTicket: React.FC<ReservationTicketProps> = ({
  reservation,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const resDate = reservation.date || reservation.reservation_date || 'Upcoming';
  const resTime = reservation.time || reservation.reservation_time || 'Scheduled';
  const partySize = reservation.party_size || 2;
  const guestName = reservation.customer_name || 'Guest';
  const guestPhone = reservation.customer_phone || 'On file';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservation.confirmation_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    setIsCancelling(true);
    try {
      await onCancel(reservation.confirmation_code);
      setConfirmCancel(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsCancelling(false);
    }
  };

  const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'modified';

  return (
    <div className="relative bg-[#FFFDF8] dark:bg-neo-surface border-3 border-black dark:border-gray-600 rounded-neo shadow-neo-lg dark:shadow-neo-dark my-3 max-w-md w-full mx-auto overflow-hidden">
      {/* Top Banner with Perforated Accent */}
      <div className="bg-neo-yellow border-b-2 border-black dark:border-gray-600 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-black dark:text-gray-100" />
          <span className="font-black tracking-wider text-xs uppercase">
            GoodFoods Official Pass
          </span>
        </div>
        <span
          className={`font-mono font-black text-xs px-2 py-0.5 border border-black dark:border-gray-600 ${
            isConfirmed ? 'bg-neo-green text-black dark:text-gray-100' : 'bg-red-400 text-white'
          }`}
        >
          {reservation.status?.toUpperCase() || 'CONFIRMED'}
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="p-4 space-y-3.5 text-left">
        {/* Restaurant Name */}
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-gray-500 dark:text-gray-400">
            Venue
          </span>
          <h3 className="font-black text-lg uppercase tracking-tight text-black dark:text-gray-100 leading-none mt-0.5">
            {reservation.restaurant_name}
          </h3>
        </div>

        {/* Date, Time, Party Size Grid */}
        <div className="grid grid-cols-3 gap-2 bg-neo-canvas dark:bg-neo-surface-alt border-2 border-black dark:border-gray-600 p-2.5 font-mono">
          <div>
            <div className="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-black dark:text-gray-100" />
              <span>Date</span>
            </div>
            <div className="font-black text-xs text-black dark:text-gray-100 mt-0.5">
              {resDate}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-black dark:text-gray-100" />
              <span>Time</span>
            </div>
            <div className="font-black text-xs text-black dark:text-gray-100 mt-0.5">
              {resTime}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-black dark:text-gray-100" />
              <span>Guests</span>
            </div>
            <div className="font-black text-xs text-black dark:text-gray-100 mt-0.5">
              {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-black dark:text-gray-100" /> Guest Name
            </span>
            <div className="font-bold text-black dark:text-gray-100 truncate mt-0.5">
              {guestName}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
              <Phone className="w-2.5 h-2.5 text-black dark:text-gray-100" /> Phone
            </span>
            <div className="font-mono font-bold text-black dark:text-gray-100 truncate mt-0.5">
              {guestPhone}
            </div>
          </div>
        </div>

        {/* Special Requests if any */}
        {reservation.special_requests && (
          <div className="bg-neo-blue/10 border border-black dark:border-gray-600/30 p-2 text-xs">
            <span className="font-mono font-bold text-[10px] uppercase text-gray-700 dark:text-gray-300 block">
              Special Requests:
            </span>
            <span className="text-gray-900 dark:text-gray-100">{reservation.special_requests}</span>
          </div>
        )}

        {/* Confirmation Code Strip */}
        <div className="border-t-2 border-dashed border-black dark:border-gray-600 pt-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase font-bold text-gray-500 dark:text-gray-400 block">
              Confirmation Code
            </span>
            <span className="font-mono font-black text-base tracking-widest text-black dark:text-gray-100 bg-neo-yellow/30 px-1.5 py-0.5 border border-black dark:border-gray-600">
              {reservation.confirmation_code}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            aria-label="Copy Confirmation Code"
            className="btn-neo bg-white dark:bg-neo-surface hover:bg-neo-yellow text-xs px-2.5 py-1 flex items-center gap-1 font-mono"
            title="Copy Confirmation Code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-700" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-black dark:text-gray-100" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>

        {/* Simulated Retro Barcode */}
        <div className="flex flex-col items-center pt-2">
          <div className="flex items-center gap-1 h-7 w-full justify-center opacity-80 select-none overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-black h-full" style={{ width: `${((i % 3) + 1) * 2}px` }} />
            ))}
          </div>
          <span className="font-mono text-[9px] text-gray-500 dark:text-gray-400 tracking-widest mt-1">
            * {reservation.confirmation_code} *
          </span>
        </div>
      </div>

      {/* Cancel Action Footer */}
      {isConfirmed && onCancel && (
        <div className="bg-neo-canvas dark:bg-neo-surface-alt border-t-2 border-black dark:border-gray-600 p-2 text-center">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-xs font-mono font-bold text-red-600 hover:text-red-800 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Need to cancel this booking?</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Confirm cancel?
              </span>
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="btn-neo bg-red-500 text-white text-xs px-2.5 py-1"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="btn-neo bg-white dark:bg-neo-surface text-xs px-2.5 py-1"
              >
                Keep
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
