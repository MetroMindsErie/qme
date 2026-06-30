import { supabase } from './supabase';

function storageAvailable() {
  try {
    const key = 'qme:storage-test';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function createGuestToken() {
  const webCrypto: Crypto | undefined = typeof globalThis.crypto !== 'undefined'
    ? globalThis.crypto
    : undefined;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  if (webCrypto?.getRandomValues) {
    const bytes = new Uint8Array(24);
    webCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function eventSessionKey(eventId: string) {
  return `qme:guestSession:${eventId}`;
}

function queueSessionKey(queueId: string) {
  return `qme:guestQueueSession:${queueId}`;
}

export function getGuestSessionToken(eventId: string): string {
  if (!storageAvailable()) return createGuestToken();
  const key = eventSessionKey(eventId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const token = createGuestToken();
  localStorage.setItem(key, token);
  return token;
}

export function getGuestTokenForQueue(queueId: string, eventId?: string | null): string {
  if (eventId) return getGuestSessionToken(eventId);
  if (!storageAvailable()) return createGuestToken();
  const key = queueSessionKey(queueId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const token = createGuestToken();
  localStorage.setItem(key, token);
  return token;
}

export function isMissingGuestSessionRpc(error: unknown): boolean {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const code = typeof record.code === 'string' ? record.code : '';
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    message.includes('function') && message.includes('does not exist');
}

export async function tryEnsureGuestSession(input: {
  eventId: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
}): Promise<string | null> {
  const token = getGuestSessionToken(input.eventId);
  const { data, error } = await supabase.rpc('ensure_guest_session', {
    p_event_id: input.eventId,
    p_guest_token: token,
    p_first_name: input.firstName ?? '',
    p_last_name: input.lastName ?? '',
    p_email: input.email?.trim() || null,
    p_phone: input.phone?.trim() || null,
  });

  if (error) {
    if (isMissingGuestSessionRpc(error)) return null;
    console.warn('Guest session could not be ensured', error);
    return null;
  }

  return typeof data === 'string' ? data : null;
}
