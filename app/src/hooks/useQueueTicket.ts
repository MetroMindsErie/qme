import { useState, useEffect, useCallback, useRef } from 'react';
import {
  nextTicketForQueue,
  peekTicketForQueue,
  restoreTicketForQueue,
  checkInTicket as apiCheckIn,
  leaveQueue as apiLeave,
} from '../lib/queueService';

// Storage keys are scoped per queue
function localKey(queueId: string) {
  return `qme:ticket:${queueId}`;
}
function localNumKey(queueId: string) {
  return `qme:ticketNum:${queueId}`;
}
function checkedInKey(queueId: string, ticketId: number) {
  return `qme:checkedIn:${queueId}:${ticketId}`;
}

export function getStoredQueueTicket(queueId: string): string {
  return localStorage.getItem(localKey(queueId)) || '';
}

export function getStoredQueueTicketNumber(queueId: string): string {
  return localStorage.getItem(localNumKey(queueId)) || getStoredQueueTicket(queueId);
}

export function clearQueueTicket(queueId: string) {
  const ticketStr = localStorage.getItem(localKey(queueId));
  try { localStorage.removeItem(localKey(queueId)); } catch { /* */ }
  try { localStorage.removeItem(localNumKey(queueId)); } catch { /* */ }
  if (ticketStr) {
    try { localStorage.removeItem(checkedInKey(queueId, Number(ticketStr))); } catch { /* */ }
  }
}

/** Returns all queue IDs the guest currently has tickets for */
export function getActiveQueueIds(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('qme:ticket:')) {
      const qid = key.replace('qme:ticket:', '');
      if (localStorage.getItem(key)) ids.push(qid);
    }
  }
  return ids;
}

/**
 * Queue-scoped ticket hook.
 * Returns both ticketId (for API) and ticketNumber (for display).
 */
export function useQueueTicket(queueId: string | undefined) {
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [lastIssued, setLastIssued] = useState(0);
  const claimBusyRef = useRef(false);

  // Restore from storage on mount / queueId change
  useEffect(() => {
    if (!queueId) return;
    const stored = localStorage.getItem(localKey(queueId));
    const storedNum = localStorage.getItem(localNumKey(queueId));
    if (stored) {
      const id = Number(stored);
      if (id > 0) {
        setTicketId(id);
        setTicketNumber(Number(storedNum) || id);
        setHasCheckedIn(
          localStorage.getItem(checkedInKey(queueId, id)) === '1'
        );
      }
    } else {
      setTicketId(null);
      setTicketNumber(null);
      setHasCheckedIn(false);
    }
  }, [queueId]);

  const refreshLastIssued = useCallback(async () => {
    if (!queueId) return;
    try {
      const val = await peekTicketForQueue(queueId);
      setLastIssued(val);
    } catch (e) {
      console.error('peek failed', e);
    }
  }, [queueId]);

  // Helper: store ticket info
  function storeTicket(qId: string, id: number, num: number) {
    try { localStorage.setItem(localKey(qId), String(id)); } catch { /* */ }
    try { localStorage.setItem(localNumKey(qId), String(num)); } catch { /* */ }
  }

  // Claim or adopt a ticket for this queue
  const claimTicket = useCallback(async (): Promise<number | null> => {
    if (!queueId || claimBusyRef.current) return ticketId;
    claimBusyRef.current = true;
    try {
      // Already have one?
      const existing = localStorage.getItem(localKey(queueId));
      if (existing) {
        const id = Number(existing);
        setTicketId(id);
        setTicketNumber(Number(localStorage.getItem(localNumKey(queueId))) || id);
        try {
          const result = await restoreTicketForQueue(id, queueId);
          setTicketNumber(result.ticketNumber);
          storeTicket(queueId, result.id, result.ticketNumber);
        } catch { /* */ }
        return id;
      }

      // Short race guard
      await new Promise<void>((r) => setTimeout(r, 40));
      const recheck = localStorage.getItem(localKey(queueId));
      if (recheck) {
        const id = Number(recheck);
        setTicketId(id);
        setTicketNumber(Number(localStorage.getItem(localNumKey(queueId))) || id);
        return id;
      }

      // Claim new
      const result = await nextTicketForQueue(queueId);
      setTicketId(result.id);
      setTicketNumber(result.ticketNumber);
      storeTicket(queueId, result.id, result.ticketNumber);
      return result.ticketNumber;
    } catch (e) {
      console.error('ticket claim failed', e);
      return null;
    } finally {
      claimBusyRef.current = false;
    }
  }, [queueId, ticketId]);

  const checkIn = useCallback(async () => {
    if (!ticketId || !queueId || hasCheckedIn) return;
    setHasCheckedIn(true);
    try {
      localStorage.setItem(checkedInKey(queueId, ticketId), '1');
    } catch { /* */ }
    try {
      await apiCheckIn(ticketId);
    } catch (e) {
      console.error('check-in failed', e);
    }
  }, [ticketId, queueId, hasCheckedIn]);

  const leave = useCallback(
    async (reason = 'user') => {
      const id = ticketId || 0;
      if (id) {
        try { await apiLeave(id, reason); } catch (e) {
          console.warn('leave failed (non-fatal)', e);
        }
      }
      if (queueId) clearQueueTicket(queueId);
      setTicketId(null);
      setTicketNumber(null);
      setHasCheckedIn(false);
    },
    [ticketId, queueId]
  );

  // Cross-tab sync
  useEffect(() => {
    if (!queueId) return;
    const handler = (e: StorageEvent) => {
      if (e.key === localKey(queueId)) {
        if (e.newValue) {
          const tid = Number(e.newValue);
          if (tid > 0) {
            setTicketId(tid);
            setTicketNumber(
              Number(localStorage.getItem(localNumKey(queueId))) || tid
            );
            setHasCheckedIn(
              localStorage.getItem(checkedInKey(queueId, tid)) === '1'
            );
          }
        } else {
          setTicketId(null);
          setTicketNumber(null);
          setHasCheckedIn(false);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [queueId]);

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
