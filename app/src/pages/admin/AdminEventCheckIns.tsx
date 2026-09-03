/**
 * Admin: Named event check-ins for the mobile bar alpha flow.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent, updateEvent } from '../../lib/eventService';
import { getEventCheckInConfig, type EventCheckInAvailabilityMode, type EventCheckInCompletionMode } from '../../lib/eventConfig';
import { formatTotalGuests, getCheckInPartySize } from '../../lib/checkInPartySize';
import { downloadCsv, formatCsvTimestamp, safeCsvFilename } from '../../lib/csvExport';
import {
  EVENTBRITE_IMPORT_ACCEPT,
  importEventbriteRegistrationsForEvent,
  previewEventbriteRegistrationsForEvent,
  readEventbriteRegistrationFile,
  type EventbriteRegistrationFileData,
  type EventbriteRegistrationImportResult,
  type EventbriteRegistrationPreviewResult,
} from '../../lib/eventbriteRegistrationImport';
import {
  canManageEvent,
  getCurrentAdminPrincipal,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import {
  adminCancelEventCheckIn,
  adminCompleteEventCheckIn,
  adminUpdateEventCheckInTicketType,
  listEventCheckIns,
  onEventCheckInsChange,
} from '../../lib/checkInService';
import { adminGrantGuestCreditForCheckIn, listGuestCreditsForEvent } from '../../lib/guestCreditService';
import { isSotcEventSlug } from '../../lib/sotc';
import type { EventCheckIn, EventGuestCredit, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

interface AdminEventCheckInsProps {
  checkInCode?: string | null;
  title?: string;
}

type CheckInAdminTab = 'live' | 'history' | 'settings';

type CheckInAdditionalAttendee = {
  position: number;
  externalOrderId: string;
  firstName: string;
  lastName: string;
};

type CheckInAttendanceExportRow = {
  checkIn: EventCheckIn;
  attendeeRole: 'primary' | 'additional';
  attendeeExternalOrderId: string;
  primaryOrderId: string;
  firstName: string;
  lastName: string;
  registeredPartySize: number;
  actualPartySize: number;
  additionalAttendee?: CheckInAdditionalAttendee;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asCsvString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function asInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value));
  if (typeof value !== 'string') return null;
  const parsed = Number.parseInt(value.trim().replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : null;
}

function checkInField(row: EventCheckIn, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key];
}

function getPrimaryOrderId(row: EventCheckIn): string {
  const metadata = asRecord(row.metadata);
  return asCsvString(metadata.external_order_id || metadata.eventbrite_order_id);
}

export function getCheckInRegisteredPartySize(row: EventCheckIn): number {
  const metadata = asRecord(row.metadata);
  const importedRegistration = asRecord(metadata.imported_registration);
  return asInteger(metadata.registered_party_size)
    ?? asInteger(metadata.tickets)
    ?? asInteger(importedRegistration.party_size)
    ?? asInteger(importedRegistration.tickets)
    ?? getCheckInPartySize(row);
}

export function getCheckInAdditionalAttendees(row: EventCheckIn): CheckInAdditionalAttendee[] {
  const rawAttendees = asRecord(row.metadata).additional_attendees;
  if (!Array.isArray(rawAttendees)) return [];
  const primaryOrderId = getPrimaryOrderId(row);
  return rawAttendees.flatMap((attendee) => {
    const record = asRecord(attendee);
    const position = asInteger(record.position);
    const firstName = asCsvString(record.first_name || record.firstName).trim();
    const lastName = asCsvString(record.last_name || record.lastName).trim();
    if (!position || !firstName || !lastName) return [];
    return [{
      position,
      externalOrderId: asCsvString(record.external_order_id || record.externalOrderId || (primaryOrderId ? `${primaryOrderId}-${position}` : '')).trim(),
      firstName,
      lastName,
    }];
  }).sort((a, b) => a.position - b.position);
}

export function buildCheckInAttendanceExportRows(checkIns: EventCheckIn[]): CheckInAttendanceExportRow[] {
  return checkIns.flatMap((row) => {
    const primaryOrderId = getPrimaryOrderId(row);
    const actualPartySize = getCheckInPartySize(row);
    const registeredPartySize = getCheckInRegisteredPartySize(row);
    const primary: CheckInAttendanceExportRow = {
      checkIn: row,
      attendeeRole: 'primary',
      attendeeExternalOrderId: primaryOrderId,
      primaryOrderId,
      firstName: row.first_name,
      lastName: row.last_name,
      registeredPartySize,
      actualPartySize,
    };
    return [
      primary,
      ...getCheckInAdditionalAttendees(row).map((attendee) => ({
        checkIn: row,
        attendeeRole: 'additional' as const,
        attendeeExternalOrderId: attendee.externalOrderId,
        primaryOrderId,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        registeredPartySize,
        actualPartySize,
        additionalAttendee: attendee,
      })),
    ];
  });
}

export function getCheckInRegistrationSource(row: EventCheckIn): 'imported' | 'self_registered' | 'needs_help' {
  const metadata = asRecord(row.metadata);
  if (metadata.imported_registration_id) return 'imported';
  if (metadata.needs_help === true || metadata.registration_match_status === 'needs_help') return 'needs_help';
  return 'self_registered';
}

export default function AdminEventCheckIns({
  checkInCode = null,
  title = 'Event Check-In',
}: AdminEventCheckInsProps) {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>([]);
  const [photoCredits, setPhotoCredits] = useState<EventGuestCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [activeTab, setActiveTab] = useState<CheckInAdminTab>('live');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState('');
  const [importingEventbrite, setImportingEventbrite] = useState(false);
  const [eventbritePreviewing, setEventbritePreviewing] = useState(false);
  const [eventbriteImportStatus, setEventbriteImportStatus] = useState('');
  const [eventbriteImportResult, setEventbriteImportResult] = useState<EventbriteRegistrationImportResult | null>(null);
  const [eventbritePreview, setEventbritePreview] = useState<EventbriteRegistrationPreviewResult | null>(null);
  const [eventbritePendingFile, setEventbritePendingFile] = useState<EventbriteRegistrationFileData | null>(null);
  const [removingCheckInIds, setRemovingCheckInIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const [ev, admin] = await Promise.all([
        getEvent(eventId),
        getCurrentAdminPrincipal(),
      ]);
      const [rows, credits] = await Promise.all([
        listEventCheckIns(ev.id, checkInCode),
        listGuestCreditsForEvent(ev.id, 'professional_headshot'),
      ]);
      setEvent(ev);
      setCurrentAdmin(admin);
      setCheckIns(rows);
      setPhotoCredits(credits);
      setError('');
    } catch (e) {
      console.error('Failed to load check-ins', e);
      setError('Could not load check-ins. Confirm the event_check_ins table exists in Supabase.');
    } finally {
      setLoading(false);
    }
  }, [eventId, checkInCode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!event?.id) return;
    return onEventCheckInsChange(event.id, refresh);
  }, [event?.id, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!event) return;
    if (!canManageEvent(currentAdmin, event) && activeTab === 'settings') {
      setActiveTab('live');
    }
  }, [activeTab, currentAdmin, event]);

  async function checkInGuest(
    id: string,
    ticketType?: NonNullable<EventCheckIn['ticket_type']>
  ) {
    try {
      if (ticketType) {
        await adminCompleteEventCheckIn(id, ticketType);
      } else {
        await adminCompleteEventCheckIn(id);
      }
      await refresh();
    } catch (e) {
      console.error('Failed to update check-in', e);
      alert('Could not update check-in.');
    }
  }

  async function cancelCheckInGuest(row: EventCheckIn) {
    const guestName = `${row.first_name} ${row.last_name}`.trim() || 'this guest';
    const confirmed = window.confirm(
      `Remove ${guestName} from live check-in? They will move to history as removed. If this was an imported registration match, the registration will be released so the right guest can claim it.`
    );
    if (!confirmed) return;

    try {
      setRemovingCheckInIds((current) => new Set(current).add(row.id));
      const removedRow = await adminCancelEventCheckIn(row.id);
      if (removedRow.status !== 'cancelled') {
        throw new Error(`Remove returned ${removedRow.status || 'unknown'} instead of cancelled.`);
      }
      await refresh();
    } catch (e) {
      console.error('Failed to remove check-in', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Could not remove this check-in. ${message}`);
    } finally {
      setRemovingCheckInIds((current) => {
        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
    }
  }

  async function updateGuestAccess(
    id: string,
    ticketType: NonNullable<EventCheckIn['ticket_type']>
  ) {
    try {
      await adminUpdateEventCheckInTicketType(id, ticketType);
      await refresh();
    } catch (e) {
      console.error('Failed to update guest access', e);
      alert('Could not update guest access.');
    }
  }

  async function grantPhotoCredit(row: EventCheckIn) {
    try {
      await adminGrantGuestCreditForCheckIn({
        checkInId: row.id,
        creditKey: 'professional_headshot',
        metadata: {
          guest_name: `${row.first_name} ${row.last_name}`.trim(),
        },
      });
      await refresh();
    } catch (e) {
      console.error('Failed to grant photo credit', e);
      alert('Could not grant photo credit.');
    }
  }

  function exportCheckInsCsv() {
    if (!event) return;
    const filename = `${safeCsvFilename(event.slug || event.name)}-check-ins-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, [
      { header: 'event_name', value: () => event.name },
      { header: 'event_slug', value: () => event.slug },
      { header: 'check_in_id', value: (row) => row.checkIn.id },
      { header: 'attendee_role', value: (row) => row.attendeeRole },
      { header: 'attendee_external_order_id', value: (row) => row.attendeeExternalOrderId },
      { header: 'primary_order_id', value: (row) => row.primaryOrderId },
      { header: 'first_name', value: (row) => row.firstName },
      { header: 'last_name', value: (row) => row.lastName },
      { header: 'status', value: (row) => row.checkIn.status },
      { header: 'ticket_type', value: (row) => row.checkIn.ticket_type ?? '' },
      { header: 'email', value: (row) => row.attendeeRole === 'primary' ? asCsvString(checkInField(row.checkIn, 'email')) : '' },
      { header: 'phone', value: (row) => row.attendeeRole === 'primary' ? asCsvString(checkInField(row.checkIn, 'phone')) : '' },
      { header: 'imported_registration_id', value: (row) => asCsvString(asRecord(row.checkIn.metadata).imported_registration_id) },
      { header: 'registration_match_status', value: (row) => asCsvString(asRecord(row.checkIn.metadata).registration_match_status) },
      { header: 'registration_source', value: (row) => getCheckInRegistrationSource(row.checkIn) },
      { header: 'external_order_id', value: (row) => row.attendeeExternalOrderId },
      { header: 'party_size', value: (row) => row.actualPartySize },
      { header: 'actual_party_size', value: (row) => row.actualPartySize },
      { header: 'registered_party_size', value: (row) => row.registeredPartySize },
      { header: 'guests_represented', value: (row) => row.actualPartySize },
      { header: 'additional_attendee_position', value: (row) => row.additionalAttendee?.position ?? '' },
      { header: 'needs_help', value: (row) => asRecord(row.checkIn.metadata).needs_help === true ? 'yes' : 'no' },
      {
        header: 'headshot_credit_status',
        value: (row) => {
          if (row.attendeeRole !== 'primary') return '';
          const credit = photoCredits.find((item) => item.check_in_id === row.checkIn.id);
          if (!credit) return '';
          if (credit.used_quantity >= credit.quantity) return 'used';
          return 'available';
        },
      },
      { header: 'headshot_credit_quantity', value: (row) => row.attendeeRole === 'primary' ? photoCredits.find((item) => item.check_in_id === row.checkIn.id)?.quantity ?? '' : '' },
      { header: 'headshot_credit_used_quantity', value: (row) => row.attendeeRole === 'primary' ? photoCredits.find((item) => item.check_in_id === row.checkIn.id)?.used_quantity ?? '' : '' },
      { header: 'created_at', value: (row) => formatCsvTimestamp(row.checkIn.created_at) },
      { header: 'updated_at', value: (row) => formatCsvTimestamp(row.checkIn.updated_at) },
    ], buildCheckInAttendanceExportRows(checkIns));
  }

  async function updateCheckInSettings(
    patch: Partial<{
      completionMode: EventCheckInCompletionMode;
      requireCompletedForParticipation: boolean;
      importedRegistrationLookupEnabled: boolean;
      selfRegistrationFallbackEnabled: boolean;
      selfRegistrationRequiresEmail: boolean;
      availabilityMode: EventCheckInAvailabilityMode;
      scheduledOpenTime: string;
      scheduledCloseTime: string;
      manualOpenedAt: string;
      manualClosedAt: string;
    }>
  ) {
    if (!event) return;

    const metadata = asRecord(event.metadata);
    const currentCheckIn = asRecord(metadata.check_in);
    const current = getEventCheckInConfig(event);
    const completionMode = patch.completionMode ?? current.completionMode;
    const enabled = completionMode !== 'none';
    const requireCompletedForParticipation = enabled
      ? patch.requireCompletedForParticipation ?? current.requireCompletedForParticipation
      : false;
    const importedRegistrationLookupEnabled = enabled
      ? patch.importedRegistrationLookupEnabled ?? current.importedRegistrationLookupEnabled
      : false;
    const selfRegistrationFallbackEnabled = enabled
      ? patch.selfRegistrationFallbackEnabled ?? current.selfRegistrationFallbackEnabled
      : false;
    const selfRegistrationRequiresEmail = patch.selfRegistrationRequiresEmail
      ?? current.selfRegistrationRequiredFields.includes('email');
    const availabilityMode = patch.availabilityMode ?? current.availability.mode;
    const scheduledOpenTime = patch.scheduledOpenTime ?? current.availability.scheduledOpenTime;
    const scheduledCloseTime = patch.scheduledCloseTime ?? current.availability.scheduledCloseTime;
    const clearManualOverride = patch.availabilityMode === 'scheduled';
    const manualOpenedAt = clearManualOverride ? '' : patch.manualOpenedAt ?? current.availability.manualOpenedAt;
    const manualClosedAt = clearManualOverride ? '' : patch.manualClosedAt ?? current.availability.manualClosedAt;

    const nextMetadata = {
      ...metadata,
      check_in: {
        ...currentCheckIn,
        enabled,
        completion_mode: completionMode,
        availability_mode: availabilityMode,
        scheduled_open_time: scheduledOpenTime,
        scheduled_close_time: scheduledCloseTime,
        manual_opened_at: manualOpenedAt,
        manual_closed_at: manualClosedAt,
        require_completed_for_participation: requireCompletedForParticipation,
        imported_registration_lookup_enabled: importedRegistrationLookupEnabled,
        self_registration: {
          ...asRecord(currentCheckIn.self_registration),
          enabled: selfRegistrationFallbackEnabled,
          required_fields: selfRegistrationRequiresEmail
            ? ['first_name', 'last_name', 'email']
            : ['first_name', 'last_name'],
        },
      },
    };

    setSavingSettings(true);
    setSettingsStatus('Saving...');
    try {
      const updated = await updateEvent(event.id, { metadata: nextMetadata });
      setEvent(updated);
      setSettingsStatus('Saved');
      window.setTimeout(() => setSettingsStatus(''), 1800);
    } catch (e) {
      console.error('Failed to update check-in settings', e);
      setSettingsStatus('Save failed');
      alert('Could not save check-in settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  function openCheckInNow() {
    updateCheckInSettings({
      availabilityMode: 'manual_open',
      manualOpenedAt: new Date().toISOString(),
      manualClosedAt: '',
    });
  }

  function closeCheckInNow() {
    updateCheckInSettings({
      availabilityMode: 'closed',
      manualClosedAt: new Date().toISOString(),
    });
  }

  async function handleEventbritePreview(file: File | null) {
    if (!event || !file) return;
    setEventbritePreviewing(true);
    setEventbriteImportStatus('Reading file...');
    setEventbriteImportResult(null);
    setEventbritePreview(null);
    setEventbritePendingFile(null);
    try {
      const fileData = await readEventbriteRegistrationFile(file);
      const preview = await previewEventbriteRegistrationsForEvent({
        eventId: event.id,
        fileData,
      });
      setEventbritePendingFile(fileData);
      setEventbritePreview(preview);
      setEventbriteImportStatus(preview.invalidRows.length > 0
        ? `File recognized with ${preview.invalidRows.length} invalid order(s). Review before importing.`
        : 'Preview ready. Review recognized fields before importing.');
    } catch (e) {
      console.error('Eventbrite preview failed', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      setEventbriteImportStatus(`Preview failed: ${message}`);
    } finally {
      setEventbritePreviewing(false);
    }
  }

  async function handleEventbriteImport() {
    if (!event || !eventbritePendingFile || !eventbritePreview) return;
    setImportingEventbrite(true);
    setEventbriteImportStatus('Importing...');
    setEventbriteImportResult(null);
    try {
      const result = await importEventbriteRegistrationsForEvent({
        eventId: event.id,
        sourceFileName: eventbritePendingFile.sourceFileName,
        fileData: eventbritePendingFile,
      });
      setEventbriteImportResult(result);
      setEventbritePreview(null);
      setEventbritePendingFile(null);
      setEventbriteImportStatus(`Imported ${result.insertedCount}; skipped ${result.skippedExistingCount}; invalid orders ${result.invalidRows.length}.`);
    } catch (e) {
      console.error('Eventbrite import failed', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      setEventbriteImportStatus(`Import failed: ${message}`);
    } finally {
      setImportingEventbrite(false);
    }
  }

  const waiting = checkIns.filter((row) => row.status === 'waiting');
  const completed = checkIns.filter((row) => row.status === 'completed');
  const history = checkIns.filter((row) => row.status === 'completed' || row.status === 'cancelled');
  const completedGuestsRepresented = completed.reduce((sum, row) => sum + getCheckInPartySize(row), 0);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = useCallback((row: EventCheckIn) => {
    if (!normalizedSearchQuery) return true;
    const metadata = asRecord(row.metadata);
    const additionalAttendees = getCheckInAdditionalAttendees(row);
    return [
      row.first_name,
      row.last_name,
      `${row.first_name} ${row.last_name}`,
      row.status,
      row.ticket_type,
      asCsvString(checkInField(row, 'email')),
      asCsvString(checkInField(row, 'phone')),
      asCsvString(metadata.registration_match_status),
      asCsvString(metadata.import_source),
      ...additionalAttendees.flatMap((attendee) => [
        attendee.firstName,
        attendee.lastName,
        `${attendee.firstName} ${attendee.lastName}`,
        attendee.externalOrderId,
      ]),
    ].some((value) => asCsvString(value).toLowerCase().includes(normalizedSearchQuery));
  }, [normalizedSearchQuery]);
  const visibleWaiting = waiting.filter(matchesSearch);
  const visibleHistory = history.filter(matchesSearch);
  const checkInConfig = useMemo(() => getEventCheckInConfig(event), [event]);
  const canManageThisEvent = event ? canManageEvent(currentAdmin, event) : false;
  const eventLogoSrc = isSotcEventSlug(event?.slug)
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="ADMIN" titleLine2="CHECK-IN" hideMenu />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 700 }}>
          {title}
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {event?.name || 'Event'} · {waiting.length} waiting · {completed.length} checked in
        </p>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 700 }}>
            {error}
          </div>
        )}

        <div className="admin-tabs" role="tablist" aria-label="Check-in admin sections">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'live' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            Live Check-In
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'history' ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          {canManageThisEvent && (
            <button
              type="button"
              className={`admin-tab ${activeTab === 'settings' ? 'admin-tab-active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          )}
        </div>

        {(activeTab === 'live' || activeTab === 'history') && (
          <div style={{ margin: '0 0 1rem' }}>
            <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: 6 }}>
              Search attendance
            </label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name or status"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.75rem', border: '1.5px solid #d1d5db', borderRadius: 8 }}
            />
          </div>
        )}

        {activeTab === 'live' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ color: '#8B5A00', fontSize: '1.35rem', fontWeight: 900 }}>{waiting.length}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Waiting for staff</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ color: '#00a344', fontSize: '1.35rem', fontWeight: 900 }}>{completed.length}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Checked in</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ color: '#223247', fontSize: '1.35rem', fontWeight: 900 }}>{completedGuestsRepresented}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Guests represented</div>
              </div>
            </div>

            {visibleWaiting.length === 0 && !error && (
              <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
                {searchQuery.trim() ? 'No live check-ins match this search.' : 'No guests are waiting for staff check-in.'}
              </p>
            )}

            {visibleWaiting.map((row) => {
              const rowMetadata = asRecord(row.metadata);
              const needsHelp = rowMetadata.needs_help === true || rowMetadata.registration_match_status === 'needs_help';
              const isImportedMatch = Boolean(rowMetadata.imported_registration_id);
              const isRemoving = removingCheckInIds.has(row.id);

              return (
                <div
                  key={row.id}
                  style={{
                    border: `1px solid ${needsHelp ? '#fed7aa' : '#e0e0e0'}`,
                    borderRadius: 10,
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    background: needsHelp ? '#fff7ed' : '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.05rem' }}>
                        {row.first_name} {row.last_name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: '#8B5A00', fontWeight: 900, textTransform: 'uppercase' }}>
                          Waiting for staff
                        </span>
                        {needsHelp && (
                          <span style={{ background: '#ffedd5', border: '1px solid #fdba74', borderRadius: 999, color: '#9a3412', fontSize: '0.7rem', fontWeight: 900, padding: '0.1rem 0.4rem', textTransform: 'uppercase' }}>
                            Needs help
                          </span>
                        )}
                        {isImportedMatch && !needsHelp && (
                          <span style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 999, color: '#047857', fontSize: '0.7rem', fontWeight: 900, padding: '0.1rem 0.4rem', textTransform: 'uppercase' }}>
                            Matched
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {checkInCode || event?.slug !== 'peony-festival' ? (
                        <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} disabled={isRemoving} onClick={() => checkInGuest(row.id)}>
                          {needsHelp ? 'Resolve & Check In' : 'Check In'}
                        </button>
                      ) : (
                        <>
                          <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} disabled={isRemoving} onClick={() => checkInGuest(row.id, 'general')}>
                            General
                          </button>
                          <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} disabled={isRemoving} onClick={() => checkInGuest(row.id, 'flowers')}>
                            Flowers
                          </button>
                        </>
                      )}
                      <button
                        className="actionBtn actionBtn-secondary"
                        style={{
                          margin: 0,
                          width: 'auto',
                          padding: '0.45rem 0.8rem',
                          background: '#fff',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                        }}
                        disabled={isRemoving}
                        onClick={() => cancelCheckInGuest(row)}
                      >
                        {isRemoving ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem', color: '#2f3e4f' }}>
              Check-In History ({visibleHistory.length})
            </h2>
            {visibleHistory.length === 0 && (
              <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
                {searchQuery.trim() ? 'No check-in history matches this search.' : 'No check-in history yet.'}
              </p>
            )}
            {visibleHistory.map((row) => {
              const isCancelled = row.status === 'cancelled';
              const hasFlowersAccess = row.ticket_type === 'flowers';
              const photoCredit = photoCredits.find((credit) => credit.check_in_id === row.id);
              const hasPhotoCredit = Boolean(photoCredit && photoCredit.quantity > photoCredit.used_quantity);
              const hasUsedPhotoCredit = Boolean(photoCredit && photoCredit.quantity <= photoCredit.used_quantity);
              const accessLabel = isCancelled ? 'REMOVED' : hasFlowersAccess ? 'FLOWERS' : 'GENERAL';
              const additionalAttendees = getCheckInAdditionalAttendees(row);
              const actualPartySize = getCheckInPartySize(row);
              const registeredPartySize = getCheckInRegisteredPartySize(row);
              const showPartyDetails = actualPartySize > 1 || registeredPartySize > 1 || additionalAttendees.length > 0;

              return (
                <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.8rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#2f3e4f' }}>
                      {row.first_name} {row.last_name}
                    </div>
                    <div style={{ color: isCancelled ? '#dc2626' : hasFlowersAccess ? '#5B4FCE' : '#00c853', fontSize: '0.78rem', fontWeight: 800, marginTop: 2 }}>
                      {isCancelled ? accessLabel : checkInCode || event?.slug !== 'peony-festival' ? 'CHECKED IN' : accessLabel}
                    </div>
                    {showPartyDetails && (
                      <div style={{ marginTop: '0.45rem', color: '#536171', fontSize: '0.78rem', lineHeight: 1.45 }}>
                        <div>
                          Actual party size: {actualPartySize}
                          {registeredPartySize !== actualPartySize && (
                            <span> · Registered tickets: {registeredPartySize}</span>
                          )}
                        </div>
                        {additionalAttendees.length > 0 && (
                          <div style={{ display: 'grid', gap: '0.2rem', marginTop: '0.25rem' }}>
                            {additionalAttendees.map((attendee) => (
                              <div key={`${row.id}-${attendee.position}`}>
                                Guest {attendee.position}: {attendee.firstName} {attendee.lastName}
                                {attendee.externalOrderId && (
                                  <span> ({attendee.externalOrderId})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {!isCancelled && !checkInCode && event?.slug === 'peony-festival' && !hasFlowersAccess && (
                      <button
                        className="actionBtn actionBtn-primary"
                        style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => updateGuestAccess(row.id, 'flowers')}
                      >
                        Upgrade Flowers
                      </button>
                    )}
                    {!isCancelled && isSotcEventSlug(event?.slug) && (
                      <button
                        className={hasPhotoCredit || hasUsedPhotoCredit ? 'actionBtn actionBtn-secondary' : 'actionBtn actionBtn-primary'}
                        style={{ margin: 0, width: 'auto', padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                        disabled={hasPhotoCredit || hasUsedPhotoCredit}
                        onClick={() => grantPhotoCredit(row)}
                      >
                        {hasUsedPhotoCredit ? 'Photo Used' : hasPhotoCredit ? 'Photo Credit' : 'Grant Photo'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'settings' && canManageThisEvent && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="actionBtn actionBtn-secondary"
                style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                onClick={exportCheckInsCsv}
              >
                Export Check-Ins
              </button>
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', background: '#fafafa' }}>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#2f3e4f' }}>Eventbrite Import</h2>
              <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: '0.35rem' }}>
                Eventbrite CSV or Excel
              </label>
              <input
                type="file"
                aria-label="Eventbrite CSV or Excel"
                accept={EVENTBRITE_IMPORT_ACCEPT}
                disabled={importingEventbrite || eventbritePreviewing}
                onChange={(e) => {
                  void handleEventbritePreview(e.target.files?.[0] ?? null);
                  e.currentTarget.value = '';
                }}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', border: '1px solid #d0d7de', borderRadius: 8, background: '#fff' }}
              />
              <p style={{ color: '#667085', fontSize: '0.82rem', lineHeight: 1.45, margin: '0.75rem 0 0' }}>
                Uses Eventbrite Order ID for repeat-import safety and Tickets as the total guests represented by one registration.
              </p>
              {eventbriteImportStatus && (
                <p style={{ color: eventbriteImportStatus.includes('failed') ? '#B71C1C' : '#00a344', fontWeight: 800, margin: '0.75rem 0 0' }}>
                  {eventbriteImportStatus}
                </p>
              )}
              {eventbritePreview && (
                <div style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: '0.85rem', marginTop: '0.75rem', background: '#fff' }}>
                  <div style={{ color: '#223247', fontWeight: 900, marginBottom: '0.5rem' }}>
                    Eventbrite registration file recognized
                  </div>
                  <div style={{ display: 'grid', gap: '0.25rem', color: '#475467', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    <div>Source rows: {eventbritePreview.sourceRowCount ?? eventbritePreview.rowCount}</div>
                    {(eventbritePreview.ignoredFooterRowCount ?? 0) > 0 && (
                      <div>Ignored footer rows: {eventbritePreview.ignoredFooterRowCount}</div>
                    )}
                    <div>Registrations / orders found: {eventbritePreview.canonicalRegistrationCount ?? eventbritePreview.rows.length + eventbritePreview.invalidRows.length}</div>
                    <div>First Name: {eventbritePreview.recognized.firstName ? 'recognized' : 'missing'}</div>
                    <div>Last Name: {eventbritePreview.recognized.lastName ? 'recognized' : 'missing'}</div>
                    <div>Email: {eventbritePreview.recognized.email ? 'recognized' : 'missing'}</div>
                    <div>Order ID: {eventbritePreview.recognized.orderId ? 'recognized' : 'missing'}</div>
                    <div>Tickets / party size: {eventbritePreview.recognized.tickets ? 'recognized' : 'missing'}</div>
                    <div>Total registered guests represented: {eventbritePreview.totalGuestsRepresented}</div>
                    <div>New registrations: {eventbritePreview.newRegistrationCount}</div>
                    <div>Already imported/skipped: {eventbritePreview.skippedExistingCount}</div>
                    <div>Invalid orders: {eventbritePreview.invalidRows.length}</div>
                  </div>
                  {eventbritePreview.invalidRows.length > 0 && (
                    <div style={{ color: '#B71C1C', fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.35, marginTop: '0.65rem' }}>
                      First invalid order: row {eventbritePreview.invalidRows[0].sourceRowNumber}, {eventbritePreview.invalidRows[0].reason}.
                    </div>
                  )}
                  <button
                    type="button"
                    className="actionBtn actionBtn-primary"
                    style={{ margin: '0.85rem 0 0' }}
                    disabled={importingEventbrite || eventbritePreview.rows.length === 0}
                    onClick={handleEventbriteImport}
                  >
                    {importingEventbrite ? 'Importing...' : 'Import Registrations'}
                  </button>
                </div>
              )}
              {eventbriteImportResult && (
                <div style={{ color: '#475467', fontSize: '0.82rem', lineHeight: 1.45, marginTop: '0.5rem' }}>
                  Source rows processed: {eventbriteImportResult.sourceRowCount ?? eventbriteImportResult.rowCount}. Ignored footer rows: {eventbriteImportResult.ignoredFooterRowCount ?? 0}. Registrations/orders processed: {eventbriteImportResult.processedCount}. New registrations: {eventbriteImportResult.insertedCount}. Existing Order IDs skipped: {eventbriteImportResult.skippedExistingCount}. Invalid orders: {eventbriteImportResult.invalidRows.length}.
                </div>
              )}
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', background: '#fafafa' }}>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#2f3e4f' }}>Check-In Behavior</h2>
              <div style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: '0.85rem', marginBottom: '1rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: checkInConfig.availability.isOpen ? '#047857' : '#8B5A00', fontWeight: 900 }}>
                      {checkInConfig.availability.label}
                    </div>
                    <div style={{ color: '#667085', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.45, marginTop: '0.25rem' }}>
                      Public Check-In availability is separate from event publication.
                    </div>
                  </div>
                  {event?.slug && (
                    <a
                      className="actionBtn actionBtn-secondary"
                      style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem', textDecoration: 'none' }}
                      href={`/events/${event.slug}/check-in?mode=shared&adminTest=1`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Test Shared iPad
                    </a>
                  )}
                </div>
              </div>
              <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: '0.35rem' }}>
                Check-In Availability
              </label>
              <select
                value={checkInConfig.availability.mode}
                disabled={savingSettings || checkInConfig.completionMode === 'none'}
                onChange={(e) => updateCheckInSettings({ availabilityMode: e.target.value as EventCheckInAvailabilityMode })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 8, border: '1px solid #d0d7de', marginBottom: '0.75rem' }}
              >
                <option value="closed">Closed</option>
                <option value="manual_open">Open manually</option>
                <option value="scheduled">Scheduled</option>
              </select>
              {checkInConfig.availability.mode === 'scheduled' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: '0.35rem' }}>
                      Opens
                    </label>
                    <input
                      type="time"
                      value={checkInConfig.availability.scheduledOpenTime}
                      disabled={savingSettings}
                      onChange={(e) => updateCheckInSettings({ scheduledOpenTime: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', borderRadius: 8, border: '1px solid #d0d7de' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: '0.35rem' }}>
                      Closes
                    </label>
                    <input
                      type="time"
                      value={checkInConfig.availability.scheduledCloseTime}
                      disabled={savingSettings}
                      onChange={(e) => updateCheckInSettings({ scheduledCloseTime: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', borderRadius: 8, border: '1px solid #d0d7de' }}
                    />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="actionBtn actionBtn-primary"
                  style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                  disabled={savingSettings || checkInConfig.completionMode === 'none'}
                  onClick={openCheckInNow}
                >
                  Open now
                </button>
                <button
                  type="button"
                  className="actionBtn actionBtn-secondary"
                  style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                  disabled={savingSettings || checkInConfig.completionMode === 'none'}
                  onClick={closeCheckInNow}
                >
                  Close now
                </button>
              </div>
              <label style={{ display: 'block', fontWeight: 800, color: '#2f3e4f', marginBottom: '0.35rem' }}>
                Check-In Mode
              </label>
              <select
                value={checkInConfig.completionMode}
                disabled={savingSettings}
                onChange={(e) => updateCheckInSettings({ completionMode: e.target.value as EventCheckInCompletionMode })}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 8, border: '1px solid #d0d7de', marginBottom: '0.75rem' }}
              >
                <option value="auto">Auto check-in: guests are admitted after entering their name</option>
                <option value="staff">Staff check-in: guests wait until staff confirms</option>
                <option value="none">No event check-in</option>
              </select>

              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#2f3e4f', fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={checkInConfig.requireCompletedForParticipation}
                  disabled={savingSettings || checkInConfig.completionMode === 'none'}
                  onChange={(e) => updateCheckInSettings({ requireCompletedForParticipation: e.target.checked })}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>Require completed check-in before guests can use event features</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#2f3e4f', fontWeight: 800, marginTop: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={checkInConfig.importedRegistrationLookupEnabled}
                  disabled={savingSettings || checkInConfig.completionMode === 'none'}
                  onChange={(e) => updateCheckInSettings({ importedRegistrationLookupEnabled: e.target.checked })}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>Let guests search an imported registration list</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#2f3e4f', fontWeight: 800, marginTop: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={checkInConfig.selfRegistrationFallbackEnabled}
                  disabled={savingSettings || checkInConfig.completionMode === 'none' || !checkInConfig.importedRegistrationLookupEnabled}
                  onChange={(e) => updateCheckInSettings({ selfRegistrationFallbackEnabled: e.target.checked })}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>Let unlisted guests self-register after search</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: '#2f3e4f', fontWeight: 800, marginTop: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={checkInConfig.selfRegistrationRequiredFields.includes('email')}
                  disabled={savingSettings || checkInConfig.completionMode === 'none' || !checkInConfig.selfRegistrationFallbackEnabled}
                  onChange={(e) => updateCheckInSettings({ selfRegistrationRequiresEmail: e.target.checked })}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>Require email for self-registration</span>
              </label>
              <p style={{ color: '#667085', fontSize: '0.82rem', lineHeight: 1.45, margin: '0.75rem 0 0' }}>
                Use staff check-in for SOTC-style control. Auto check-in is useful for lightweight tests where guests should enter immediately.
              </p>
              {settingsStatus && (
                <p style={{ color: settingsStatus === 'Save failed' ? '#B71C1C' : '#00a344', fontWeight: 800, margin: '0.75rem 0 0' }}>
                  {settingsStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #eee' }}>
        <button className="actionBtn actionBtn-secondary" style={{ margin: 0 }} onClick={() => navigate(`/admin/events/${eventId}`)}>
          Back to Event
        </button>
      </div>
    </div>
  );
}
