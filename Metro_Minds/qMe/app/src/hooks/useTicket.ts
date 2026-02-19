import { useState, useEffect, useCallback, useRef } from 'react';
import {
  nextTicket,
  peekTicket,
  restoreTicket,
  checkInTicket as apiCheckIn,
  leaveQueue as apiLeave,
} from '../lib/supabaseService';

const LOCAL_TICKET_KEY = 'guest:ticketId';       // database id (API calls)
const LOCAL_TICKETNUM_KEY = 'guest:ticketNum';    // display number
const SESSION_TICKET_KEY = 'guest2:ticket';
const CHECKED_IN_KEY = 'guest2:checkedIn';

function checkedInKey(id: number) {
  return `guest:checkedIn:${id}`;
}

/** Promote legacy storage keys (one-time) */
function migrateLegacyStorage() {
  try {
    const canon = localStorage.getItem(LOCAL_TICKET_KEY);
    if (!canon) {
      const legacy =
        localStorage.getItem('guest2:ticket') ||
        sessionStorage.getItem('guest2:ticket');
      if (legacy) {
        localStorage.setItem(LOCAL_TICKET_KEY, legacy);
        // Legacy: ticketNumber = id (no separate number existed)
        if (!localStorage.getItem(LOCAL_TICKETNUM_KEY)) {
          localStorage.setItem(LOCAL_TICKETNUM_KEY, legacy);
        }
      }
    }
    try { localStorage.removeItem('guest2:ticket'); } catch { /* */ }
    try { sessionStorage.removeItem('guest2:ticket'); } catch { /* */ }
  } catch { /* */ }
}

/** Get stored ticket id (database id, for API calls) */
export function getStoredTicket(): string {
  return (
    localStorage.getItem(LOCAL_TICKET_KEY) ||
    sessionStorage.getItem(SESSION_TICKET_KEY) ||
    ''
  );
}

/** Get stored ticket display number */
export function getStoredTicketNumber(): string {
  return (
    localStorage.getItem(LOCAL_TICKETNUM_KEY) ||
    getStoredTicket()   // fallback: use id if no separate number
  );
}

export function clearTicketEverywhere() {
  try { sessionStorage.removeItem(SESSION_TICKET_KEY); } catch { /* */ }
  try { sessionStorage.removeItem(CHECKED_IN_KEY); } catch { /* */ }
  try { localStorage.removeItem(LOCAL_TICKET_KEY); } catch { /* */ }
  try { localStorage.removeItem(LOCAL_TICKETNUM_KEY); } catch { /* */ }
  try { localStorage.removeItem('guest2:ticket'); } catch { /* */ }
}

/**
 * Hook for managing the guest's queue ticket.
 * Returns both ticketId (for API) and ticketNumber (for display).
 */
export function useTicket() {
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [lastIssued, setLastIssued] = useState(0);
  const claimBusyRef = useRef(false);

  // Migrate on mount
  useEffect(() => {
    migrateLegacyStorage();
  }, []);

  // Restore from storage on mount
  useEffect(() => {
    const storedId = getStoredTicket();
    const storedNum = getStoredTicketNumber();
    if (storedId) {
      const id = Number(storedId);
      if (id > 0) {
        setTicketId(id);
        setTicketNumber(Number(storedNum) || id);
        const isCheckedIn = localStorage.getItem(checkedInKey(id)) === '1';
        setHasCheckedIn(isCheckedIn);
      }
    }
  }, []);

  // Refresh lastIssued (for admin queue count)
  const refreshLastIssued = useCallback(async () => {
    try {
      const val = await peekTicket();
      setLastIssued(val);
    } catch (e) {
      console.error('peek failed', e);
    }
  }, []);

  // Helper: store ticket info in localStorage
  function storeTicket(id: number, num: number) {
    try { localStorage.setItem(LOCAL_TICKET_KEY, String(id)); } catch { /* */ }
    try { localStorage.setItem(LOCAL_TICKETNUM_KEY, String(num)); } catch { /* */ }
    try { sessionStorage.setItem(SESSION_TICKET_KEY, String(id)); } catch { /* */ }
  }

  // Claim or adopt a ticket
  const claimTicket = useCallback(async (): Promise<number | null> => {
    if (claimBusyRef.current) return ticketId;
    claimBusyRef.current = true;
    try {
      // 1) Adopt from localStorage
      let canon = localStorage.getItem(LOCAL_TICKET_KEY);
      if (canon) {
        const id = Number(canon);
        const num = Number(localStorage.getItem(LOCAL_TICKETNUM_KEY)) || id;
        setTicketId(id);
        setTicketNumber(num);
        try { sessionStorage.setItem(SESSION_TICKET_KEY, String(id)); } catch { /* */ }
        try {
          const result = await restoreTicket(id);
          setTicketNumber(result.ticketNumber);
          storeTicket(result.id, result.ticketNumber);
        } catch { /* */ }
        return id;
      }

      // 2) Adopt from sessionStorage
      const sess = sessionStorage.getItem(SESSION_TICKET_KEY);
      if (sess) {
        const id = Number(sess);
        setTicketId(id);
        setTicketNumber(id);
        try {
          const result = await restoreTicket(id);
          setTicketNumber(result.ticketNumber);
          storeTicket(result.id, result.ticketNumber);
        } catch { /* */ }
        return id;
      }

      // 3) Race-safe fresh claim
      await new Promise<void>((r) => setTimeout(r, 40));
      canon = localStorage.getItem(LOCAL_TICKET_KEY);
      if (canon) {
        const id = Number(canon);
        const num = Number(localStorage.getItem(LOCAL_TICKETNUM_KEY)) || id;
        setTicketId(id);
        setTicketNumber(num);
        return id;
      }

      // No existing ticket — claim new one
      const result = await nextTicket();
      setTicketId(result.id);
      setTicketNumber(result.ticketNumber);
      storeTicket(result.id, result.ticketNumber);
      return result.ticketNumber;
    } catch (e) {
      console.error('ticket claim failed', e);
      return null;
    } finally {
      claimBusyRef.current = false;
    }
  }, [ticketId]);

  // Check in
  const checkIn = useCallback(async () => {
    if (!ticketId || hasCheckedIn) return;
    setHasCheckedIn(true);
    try { sessionStorage.setItem(CHECKED_IN_KEY, '1'); } catch { /* */ }
    try { localStorage.setItem(checkedInKey(ticketId), '1'); } catch { /* */ }

    try {
      const bc = new BroadcastChannel('queue');
      bc.postMessage({ type: 'CHECKED_IN', ticketId });
      bc.close();
    } catch { /* */ }

    try {
      await apiCheckIn(ticketId);
    } catch (e) {
      console.error('check-in failed', e);
    }
  }, [ticketId, hasCheckedIn]);

  // Leave queue
  const leave = useCallback(
    async (reason = 'user') => {
      const id = ticketId || Number(getStoredTicket()) || 0;
      if (id) {
        try {
          await apiLeave(id, reason);
        } catch (e) {
          console.warn('leave POST failed (non-fatal)', e);
        }
      }
      clearTicketEverywhere();
      if (ticketId) {
        try { localStorage.removeItem(checkedInKey(ticketId)); } catch { /* */ }
      }
      try {
        const bc = new BroadcastChannel('queue');
        bc.postMessage({ type: 'TICKET_CLEARED', ticketId: id });
        bc.close();
      } catch { /* */ }
      setTicketId(null);
      setTicketNumber(null);
      setHasCheckedIn(false);
    },
    [ticketId]
  );

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LOCAL_TICKET_KEY && e.newValue) {
        const tid = Number(e.newValue);
        if (Number.isFinite(tid) && tid > 0) {
          setTicketId(tid);
          const num = Number(localStorage.getItem(LOCAL_TICKETNUM_KEY)) || tid;
          setTicketNumber(num);
          if (localStorage.getItem(checkedInKey(tid)) === '1') {
            setHasCheckedIn(true);
          }
        }
      }
      if (e.key === LOCAL_TICKET_KEY && e.newValue === null) {
        setTicketId(null);
        setTicketNumber(null);
        setHasCheckedIn(false);
      }
      if (ticketId && e.key === checkedInKey(ticketId) && e.newValue === '1') {
        setHasCheckedIn(true);
      }
      if (ticketId && e.key === checkedInKey(ticketId) && e.newValue === null) {
        setTicketId(null);
        setTicketNumber(null);
        setHasCheckedIn(false);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [ticketId]);

  // BroadcastChannel sync
  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const qbc = new BroadcastChannel('queue');
    qbc.onmessage = (ev) => {
      if (!ev?.data) return;
      if (ev.data.type === 'CHECKED_IN' && Number(ev.data.ticketId) === ticketId) {
        setHasCheckedIn(true);
      }
      if (ev.data.type === 'TICKET_CLEARED' && Number(ev.data.ticketId) === ticketId) {
        setTicketId(null);
        setTicketNumber(null);
        setHasCheckedIn(false);
      }
    };
    return () => qbc.close();
  }, [ticketId]);

  return {
    ticketId,
    ticketNumber,
    hasCheckedIn,
    lastIssued,
    claimTicket,
    checkIn,
    leave,
    refreshLastIssued,
    setHasCheckedIn,
  };
}
