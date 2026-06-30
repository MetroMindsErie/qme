import type { QEvent } from '../types';

function eventResetSeenKey(eventId: string) {
  return `qme:eventResetSeen:${eventId}`;
}

function removeKeysMatching(predicate: (key: string) => boolean) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && predicate(key)) localStorage.removeItem(key);
    }
  } catch {
    /* ignore unavailable browser storage */
  }
}

export function getEventTestDataResetMarker(event: QEvent | null | undefined): string {
  const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};
  const marker = metadata.test_data_reset_at;
  return typeof marker === 'string' ? marker : '';
}

export function clearGuestStateAfterEventReset(
  eventId: string,
  queueIds: string[],
  resetMarker: string
): boolean {
  if (!eventId || !resetMarker) return false;
  try {
    const seenKey = eventResetSeenKey(eventId);
    const seenMarker = localStorage.getItem(seenKey);
    if (seenMarker === resetMarker) return false;

    localStorage.removeItem(`qme:eventCheckIn:${eventId}`);
    localStorage.removeItem(`qme:guestSession:${eventId}`);

    removeKeysMatching((key) =>
      (key.startsWith('qme:eventCheckIn:') && key.endsWith(`:${eventId}`))
      || key.startsWith('qme:notHereNotice:')
    );

    for (const queueId of queueIds) {
      localStorage.removeItem(`qme:ticket:${queueId}`);
      localStorage.removeItem(`qme:ticketNum:${queueId}`);
      localStorage.removeItem(`qme:queueGuest:${queueId}`);
      localStorage.removeItem(`qme:guestQueueSession:${queueId}`);
      removeKeysMatching((key) => key.startsWith(`qme:checkedIn:${queueId}:`));
    }

    localStorage.setItem(seenKey, resetMarker);
    return true;
  } catch {
    return false;
  }
}
