import type { QEvent } from '../types';
import { eventLocalDateTimeToDate, formatEventLocalDateTime } from './eventTiming';

export type EventCheckInCompletionMode = 'staff' | 'auto' | 'none';
export type EventCheckInAvailabilityMode = 'closed' | 'manual_open' | 'scheduled';

export interface EventCheckInAvailability {
  mode: EventCheckInAvailabilityMode;
  scheduledOpenTime: string;
  scheduledCloseTime: string;
  manualOpenedAt: string;
  manualClosedAt: string;
  isOpen: boolean;
  label: string;
  actionLabel: string;
}

export interface EventCheckInConfig {
  enabled: boolean;
  completionMode: EventCheckInCompletionMode;
  availability: EventCheckInAvailability;
  requireCompletedForParticipation: boolean;
  importedRegistrationLookupEnabled: boolean;
  selfRegistrationFallbackEnabled: boolean;
  selfRegistrationRequiredFields: Array<'first_name' | 'last_name' | 'email'>;
  postCheckInInstruction: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asAvailabilityMode(value: unknown): EventCheckInAvailabilityMode {
  return value === 'manual_open' || value === 'scheduled' || value === 'closed'
    ? value
    : 'manual_open';
}

function isIsoAfter(left: string, right: string): boolean {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  return Number.isFinite(leftMs) && Number.isFinite(rightMs) && leftMs > rightMs;
}

export function getEventCheckInAvailability(
  event: QEvent | null | undefined,
  now = new Date()
): EventCheckInAvailability {
  const metadata = asRecord(event?.metadata);
  const checkIn = asRecord(metadata.check_in);
  const eventRecord = asRecord(event);
  const mode = asAvailabilityMode(checkIn.availability_mode);
  const scheduledOpenTime = asString(checkIn.scheduled_open_time || checkIn.check_in_start || eventRecord.check_in_start);
  const scheduledCloseTime = asString(checkIn.scheduled_close_time || checkIn.check_in_end || eventRecord.check_in_end);
  const manualOpenedAt = asString(checkIn.manual_opened_at);
  const manualClosedAt = asString(checkIn.manual_closed_at);
  const hasManualOpenOverride = manualOpenedAt && (!manualClosedAt || isIsoAfter(manualOpenedAt, manualClosedAt));
  const hasManualCloseOverride = manualClosedAt && (!manualOpenedAt || isIsoAfter(manualClosedAt, manualOpenedAt));

  if (mode === 'closed') {
    return {
      mode,
      scheduledOpenTime,
      scheduledCloseTime,
      manualOpenedAt,
      manualClosedAt,
      isOpen: false,
      label: 'Currently closed',
      actionLabel: scheduledOpenTime && event
        ? `Opens ${formatEventLocalDateTime(event, scheduledOpenTime)}`
        : 'Closed',
    };
  }

  if (hasManualOpenOverride) {
    return {
      mode,
      scheduledOpenTime,
      scheduledCloseTime,
      manualOpenedAt,
      manualClosedAt,
      isOpen: true,
      label: 'Currently open',
      actionLabel: 'Check In',
    };
  }

  if (hasManualCloseOverride) {
    return {
      mode,
      scheduledOpenTime,
      scheduledCloseTime,
      manualOpenedAt,
      manualClosedAt,
      isOpen: false,
      label: 'Currently closed',
      actionLabel: scheduledOpenTime && event
        ? `Opens ${formatEventLocalDateTime(event, scheduledOpenTime)}`
        : 'Closed',
    };
  }

  if (mode === 'manual_open') {
    return {
      mode,
      scheduledOpenTime,
      scheduledCloseTime,
      manualOpenedAt,
      manualClosedAt,
      isOpen: true,
      label: 'Currently open',
      actionLabel: 'Check In',
    };
  }

  const openAt = eventLocalDateTimeToDate(event?.event_date, scheduledOpenTime, event?.timezone);
  const closeAt = eventLocalDateTimeToDate(event?.event_date, scheduledCloseTime, event?.timezone);
  const isBeforeOpen = Boolean(openAt && now < openAt);
  const isAfterClose = Boolean(closeAt && now > closeAt);
  const isOpen = Boolean(openAt && now >= openAt && (!closeAt || now <= closeAt));
  const opensLabel = event && scheduledOpenTime ? formatEventLocalDateTime(event, scheduledOpenTime, { includeDate: true }) : '';
  const closesLabel = event && scheduledCloseTime ? formatEventLocalDateTime(event, scheduledCloseTime, { includeDate: true }) : '';

  return {
    mode,
    scheduledOpenTime,
    scheduledCloseTime,
    manualOpenedAt,
    manualClosedAt,
    isOpen,
    label: isOpen
      ? closeAt ? `Currently open; closes ${closesLabel}` : 'Currently open'
      : isBeforeOpen && opensLabel ? `Opens ${opensLabel}`
      : isAfterClose && closesLabel ? `Closed at ${closesLabel}`
      : 'Currently closed',
    actionLabel: isOpen
      ? 'Check In'
      : isBeforeOpen && event && scheduledOpenTime
      ? `Opens ${formatEventLocalDateTime(event, scheduledOpenTime)}`
      : 'Closed',
  };
}

export function getEventCheckInConfig(event: QEvent | null | undefined): EventCheckInConfig {
  const metadata = asRecord(event?.metadata);
  const checkIn = asRecord(metadata.check_in);
  const selfRegistration = asRecord(checkIn.self_registration);
  const configuredRequiredFields = Array.isArray(selfRegistration.required_fields)
    ? selfRegistration.required_fields
    : [];
  const completionMode = checkIn.completion_mode === 'auto'
    ? 'auto'
    : checkIn.completion_mode === 'none'
    ? 'none'
    : 'staff';
  const enabled = checkIn.enabled !== false && completionMode !== 'none';

  return {
    enabled,
    completionMode,
    availability: getEventCheckInAvailability(event),
    requireCompletedForParticipation: enabled && checkIn.require_completed_for_participation === true,
    importedRegistrationLookupEnabled: enabled && checkIn.imported_registration_lookup_enabled === true,
    selfRegistrationFallbackEnabled: enabled && selfRegistration.enabled === true,
    selfRegistrationRequiredFields: configuredRequiredFields.filter((field): field is 'first_name' | 'last_name' | 'email' => {
      return field === 'first_name' || field === 'last_name' || field === 'email';
    }),
    postCheckInInstruction: typeof checkIn.post_check_in_instruction === 'string'
      ? checkIn.post_check_in_instruction.trim()
      : '',
  };
}

export function getEventCheckInCardDescription(config: EventCheckInConfig): string {
  if (config.completionMode === 'auto' && config.importedRegistrationLookupEnabled && config.selfRegistrationFallbackEnabled) {
    return "Find your registration and check in when you arrive. If you're not on the list, you can register here.";
  }
  if (config.completionMode === 'auto' && config.importedRegistrationLookupEnabled) {
    return 'Find your registration and check in when you arrive.';
  }
  if (config.completionMode === 'auto') {
    return 'Enter your name to check in when you arrive.';
  }
  return 'Enter your name when you arrive so the event team can confirm your check-in.';
}

export function getCompletedEventCheckInMessage(config: EventCheckInConfig): string {
  return config.postCheckInInstruction
    ? `You are checked in. ${config.postCheckInInstruction}`
    : 'You are checked in. Return to the event page for next steps.';
}
