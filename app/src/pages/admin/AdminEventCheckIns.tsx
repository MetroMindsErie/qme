/**
 * Admin: Named event check-ins for the mobile bar alpha flow.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent, updateEvent } from '../../lib/eventService';
import { getEventCheckInConfig, type EventCheckInCompletionMode } from '../../lib/eventConfig';
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
import type { EventCheckIn, EventGuestCredit, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

interface AdminEventCheckInsProps {
  checkInCode?: string | null;
  title?: string;
}

type CheckInAdminTab = 'live' | 'history' | 'settings';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
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
      await adminCancelEventCheckIn(row.id);
      await refresh();
    } catch (e) {
      console.error('Failed to remove check-in', e);
      alert('Could not remove this check-in.');
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

  async function updateCheckInSettings(
    patch: Partial<{
      completionMode: EventCheckInCompletionMode;
      requireCompletedForParticipation: boolean;
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

    const nextMetadata = {
      ...metadata,
      check_in: {
        ...currentCheckIn,
        enabled,
        completion_mode: completionMode,
        require_completed_for_participation: requireCompletedForParticipation,
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

  const waiting = checkIns.filter((row) => row.status === 'waiting');
  const completed = checkIns.filter((row) => row.status === 'completed');
  const history = checkIns.filter((row) => row.status === 'completed' || row.status === 'cancelled');
  const checkInConfig = useMemo(() => getEventCheckInConfig(event), [event]);
  const canManageThisEvent = event ? canManageEvent(currentAdmin, event) : false;
  const eventLogoSrc = event?.slug === 'sotc-test-check-in'
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
      <Header logoSrc={eventLogoSrc} titleLine1="ADMIN" titleLine2="CHECK-IN" />

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

        {activeTab === 'live' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ color: '#8B5A00', fontSize: '1.35rem', fontWeight: 900 }}>{waiting.length}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Waiting for staff</div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ color: '#00a344', fontSize: '1.35rem', fontWeight: 900 }}>{completed.length}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Checked in</div>
              </div>
            </div>

            {waiting.length === 0 && !error && (
              <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
                No guests are waiting for staff check-in.
              </p>
            )}

            {waiting.map((row) => {
              const rowMetadata = asRecord(row.metadata);
              const needsHelp = rowMetadata.needs_help === true || rowMetadata.registration_match_status === 'needs_help';
              const isImportedMatch = Boolean(rowMetadata.imported_registration_id);

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
                        <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id)}>
                          {needsHelp ? 'Resolve & Check In' : 'Check In'}
                        </button>
                      ) : (
                        <>
                          <button className="actionBtn actionBtn-secondary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'general')}>
                            General
                          </button>
                          <button className="actionBtn actionBtn-primary" style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }} onClick={() => checkInGuest(row.id, 'flowers')}>
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
                        onClick={() => cancelCheckInGuest(row)}
                      >
                        Remove
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
              Check-In History ({history.length})
            </h2>
            {history.length === 0 && (
              <p style={{ color: '#999', padding: '2rem 0', textAlign: 'center' }}>
                No check-in history yet.
              </p>
            )}
            {history.map((row) => {
              const isCancelled = row.status === 'cancelled';
              const hasFlowersAccess = row.ticket_type === 'flowers';
              const photoCredit = photoCredits.find((credit) => credit.check_in_id === row.id);
              const hasPhotoCredit = Boolean(photoCredit && photoCredit.quantity > photoCredit.used_quantity);
              const hasUsedPhotoCredit = Boolean(photoCredit && photoCredit.quantity <= photoCredit.used_quantity);
              const accessLabel = isCancelled ? 'REMOVED' : hasFlowersAccess ? 'FLOWERS' : 'GENERAL';

              return (
                <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.8rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2f3e4f' }}>
                      {row.first_name} {row.last_name}
                    </div>
                    <div style={{ color: isCancelled ? '#dc2626' : hasFlowersAccess ? '#5B4FCE' : '#00c853', fontSize: '0.78rem', fontWeight: 800, marginTop: 2 }}>
                      {isCancelled ? accessLabel : checkInCode || event?.slug !== 'peony-festival' ? 'CHECKED IN' : accessLabel}
                    </div>
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
                    {!isCancelled && event?.slug === 'sotc-test-check-in' && (
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
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', background: '#fafafa' }}>
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#2f3e4f' }}>Check-In Behavior</h2>
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
