import type { QEvent } from '../types';

export type EventCheckInCompletionMode = 'staff' | 'auto' | 'none';

export interface EventCheckInConfig {
  enabled: boolean;
  completionMode: EventCheckInCompletionMode;
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
