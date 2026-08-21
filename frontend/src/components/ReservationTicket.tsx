import React, { useState } from 'react';
import {
  Ticket,
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  Check,
  Copy,
  XCircle,
  Edit3,
  Save,
} from 'lucide-react';
import type { Reservation } from '../types';

interface ReservationTicketProps {
  reservation: Reservation;
  onCancel?: (code: string) => Promise<void>;
  onModify?: (
    code: string,
    newDate: string,
    newTime: string,
    newPartySize: number,
    newRequests?: string
  ) => Promise<void>;
}

export const ReservationTicket: React.FC<ReservationTicketProps> = ({
  reservation,
  onCancel,
  onModify,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modifyError, setModifyError] = useState<string | null>(null);

  const resDate = reservation.date || reservation.reservation_date || 'Upcoming';
  const resTime = reservation.time || reservation.reservation_time || 'Scheduled';
  const partySize = reservation.party_size || 2;
  const guestName = reservation.customer_name || 'Guest';
  const guestPhone = reservation.customer_phone || 'On file';

  const [editDate, setEditDate] = useState(resDate);
  const [editTime, setEditTime] = useState(resTime);
  const [editSize, setEditSize] = useState(partySize);
  const [editRequests, setEditRequests] = useState(reservation.special_requests || '');

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onModify) return;
    setIsSaving(true);
    setModifyError(null);
    try {
      await onModify(
        reservation.confirmation_code,
        editDate,
        editTime,
        Number(editSize),
        editRequests.trim() || undefined
      );
      setIsEditing(false);
    } catch (err: unknown) {
      setModifyError(err instanceof Error ? err.message : 'Could not modify booking.');
    } finally {
      setIsSaving(false);
    }
  };

  const isConfirmed = reservation.status === 'confirmed' || reservation.status === 'modified';

  return (
    <div className="relative bg-neo-card border-3 border-black rounded-neo-lg shadow-neo-lg my-3 max-w-md w-full mx-auto overflow-hidden transition-all">
      {/* Top Banner with Perforated Accent */}
      <div className="bg-neo-yellow border-b-2 border-black p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-black" />
          <span className="font-black tracking-wider text-xs uppercase text-black">
            GoodFoods Official Pass
          </span>
        </div>
        <span
          className={`font-mono font-black text-xs px-2 py-0.5 border border-black rounded-neo-sm ${
            isConfirmed ? 'bg-neo-green text-black' : 'bg-red-400 text-white'
          }`}
        >
          {reservation.status?.toUpperCase() || 'CONFIRMED'}
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="p-4 space-y-3.5 text-left">
        {/* Restaurant Name */}
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-neo-muted">
            Venue
          </span>
          <h3 className="font-black text-lg uppercase tracking-tight text-neo-main leading-none mt-0.5">
            {reservation.restaurant_name}
          </h3>
        </div>

        {/* Date, Time, Party Size Grid */}
        <div className="grid grid-cols-3 gap-2 bg-neo-surface border-2 border-black p-2.5 rounded-neo-sm text-center">
          <div>
            <div className="text-[9px] uppercase font-bold text-neo-muted flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-neo-orange" />
              <span>Date</span>
            </div>
            <div className="font-black text-xs text-neo-main mt-0.5 font-mono">
              {resDate}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-neo-muted flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-neo-orange" />
              <span>Time</span>
            </div>
            <div className="font-black text-xs text-neo-main mt-0.5 font-mono">
              {resTime}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-neo-muted flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-neo-orange" />
              <span>Guests</span>
            </div>
            <div className="font-black text-xs text-neo-main mt-0.5 font-mono">
              {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] font-mono font-bold text-neo-muted uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-neo-blue" /> Guest Name
            </span>
            <div className="font-bold text-neo-main truncate mt-0.5">
              {guestName}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-neo-muted uppercase flex items-center gap-1">
              <Phone className="w-3 h-3 text-neo-green" /> Phone
            </span>
            <div className="font-mono font-bold text-neo-main truncate mt-0.5">
              {guestPhone}
            </div>
          </div>
        </div>

        {/* Special Requests if any */}
        {reservation.special_requests && (
          <div className="bg-neo-blue/10 border border-black p-2 text-xs rounded-neo-sm">
            <span className="font-mono font-bold text-[10px] uppercase text-neo-main block">
              Special Requests:
            </span>
            <span className="text-neo-main">{reservation.special_requests}</span>
          </div>
        )}

        {/* Confirmation Code Strip */}
        <div className="border-t-2 border-dashed border-black pt-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase font-bold text-neo-muted block">
              Confirmation Code
            </span>
            <span className="font-mono font-black text-base tracking-widest text-black bg-neo-yellow px-2 py-0.5 border border-black rounded-neo-sm inline-block">
              {reservation.confirmation_code}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            aria-label="Copy Confirmation Code"
            className="btn-neo bg-neo-card hover:bg-neo-yellow text-xs px-2.5 py-1 flex items-center gap-1.5 font-mono font-bold text-neo-main"
            title="Copy Confirmation Code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-700" />
                <span className="text-green-700">COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-black" />
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
          <span className="font-mono text-[9px] text-black tracking-widest mt-1">
            * {reservation.confirmation_code} *
          </span>
        </div>
      </div>

      {/* Modify / Cancel Actions Footer */}
      {isConfirmed && (
        <div className="bg-neo-canvas border-t-2 border-black p-3 text-center space-y-2">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3 bg-neo-card p-3 border-2 border-black rounded-neo-sm text-left">
              <div className="flex items-center justify-between border-b border-black pb-1">
                <span className="text-[10px] font-black uppercase text-neo-main">Edit Reservation Details</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-[10px] font-mono font-bold text-neo-muted hover:text-neo-main"
                >
                  Cancel
                </button>
              </div>

              {modifyError && (
                <div className="p-2 bg-red-100 border border-red-500 text-red-800 text-[11px] font-bold rounded-neo-sm">
                  {modifyError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-0.5">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-neo-canvas border-2 border-black p-1 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-black block mb-0.5">Time</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-neo-canvas border-2 border-black p-1 text-xs font-mono font-bold"
                  >
                    {['11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neo-main block mb-0.5">Guests</label>
                  <select
                    value={editSize}
                    onChange={(e) => setEditSize(Number(e.target.value))}
                    className="w-full bg-neo-surface text-neo-main border-2 border-black p-1 text-xs font-mono font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((s) => (
                      <option key={s} value={s}>{s} {s === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neo-main block mb-0.5">Notes</label>
                  <input
                    type="text"
                    placeholder="Window seat, anniversary, etc."
                    value={editRequests}
                    onChange={(e) => setEditRequests(e.target.value)}
                    className="w-full bg-neo-surface text-neo-main border-2 border-black p-1 text-xs font-bold placeholder:text-neo-muted"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-neo bg-neo-card text-neo-main py-1 px-3 text-xs flex-1"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-neo bg-neo-yellow hover:bg-neo-orange hover:text-white text-black py-1 px-3 text-xs flex-1 flex items-center justify-center gap-1 font-black uppercase"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {onModify && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-neo bg-neo-card hover:bg-neo-yellow text-neo-main hover:text-black text-xs px-3 py-1 flex items-center gap-1 font-mono font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5 text-neo-orange" />
                  <span>Edit Details</span>
                </button>
              )}

              {onCancel && (
                <>
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="text-[11px] font-mono font-bold text-red-700 hover:text-red-900 flex items-center gap-1 ml-auto"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Booking</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        disabled={isCancelling}
                        className="btn-neo bg-neo-card text-neo-main text-xs px-2 py-0.5 font-mono"
                      >
                        Keep
                      </button>
                      <button
                        onClick={handleCancelClick}
                        disabled={isCancelling}
                        className="btn-neo bg-red-500 text-white hover:bg-red-600 text-xs px-2 py-0.5 font-mono font-black uppercase"
                      >
                        {isCancelling ? '...' : 'Confirm'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
