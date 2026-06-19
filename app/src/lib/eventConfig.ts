import type { QEvent } from '../types';

export type EventCheckInCompletionMode = 'staff' | 'auto' | 'none';

export interface EventCheckInConfig {
  enabled: boolean;
  completionMode: EventCheckInCompletionMode;
  requireCompletedForParticipation: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function getEventCheckInConfig(event: QEvent | null | undefined): EventCheckInConfig {
  const metadata = asRecord(event?.metadata);
  const checkIn = asRecord(metadata.check_in);
  const completionMode = checkIn.completion_mode === 'auto'
    ? 'auto'
    : checkIn.completion_mode === 'none'
    ? 'none'
    : 'staff';
  const enabled = checkIn.enabled !== false && completionMode !== 'none';

  return {
    enabled,
    completionMode,
    requireCompletedForParticipation: enabled && checkIn.require_completed_for_participation === true,
  };
}
