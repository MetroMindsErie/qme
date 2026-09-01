import type { EventCheckIn, ImportedRegistrationSearchResult } from '../types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value));
  if (typeof value !== 'string') return null;
  const parsed = Number.parseInt(value.trim().replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : null;
}

export function getCheckInPartySize(checkIn: EventCheckIn | null | undefined): number {
  const metadata = asRecord(checkIn?.metadata);
  const importedRegistration = asRecord(metadata.imported_registration);
  return normalizeInteger(metadata.party_size)
    ?? normalizeInteger(metadata.tickets)
    ?? normalizeInteger(importedRegistration.party_size)
    ?? normalizeInteger(importedRegistration.tickets)
    ?? 1;
}

export function getSearchResultPartySize(result: ImportedRegistrationSearchResult): number {
  const metadata = asRecord((result as unknown as Record<string, unknown>).metadata);
  return normalizeInteger(result.party_size)
    ?? normalizeInteger(metadata.party_size)
    ?? normalizeInteger(metadata.tickets)
    ?? 1;
}

export function formatTotalGuests(partySize: number): string {
  return `Total guests: ${Math.max(1, Math.floor(partySize))}`;
}

export function formatCompletedCheckInConfirmation(firstName: string, partySize: number, instruction: string): string {
  const name = firstName || 'guest';
  const total = Math.max(1, Math.floor(partySize));
  const base = total > 1
    ? `Thanks, ${name}! You and your ${total - 1} ${total === 2 ? 'guest' : 'guests'} are checked in.`
    : `Thanks, ${name}! You are checked in.`;
  return instruction ? `${base} ${instruction}` : `${base} Return to the event page for next steps.`;
}
