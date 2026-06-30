/**
 * Guest: Event check-in landing page.
 * First alpha pass: gives the event QR a clear "start here" destination.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { checkInEventGuest, createEventCheckIn, getEventCheckIn } from '../../lib/checkInService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getEventBySlug } from '../../lib/eventService';
import type { EventCheckIn, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

interface GuestEventCheckInProps {
  checkInCode?: string | null;
  title?: string;
  intro?: string;
  confirmation?: string;
}

export default function GuestEventCheckIn({
  checkInCode = null,
  title = 'Event Check-In',
  intro = 'Start here when you arrive. Enter your name so the event team can confirm your check-in.',
  confirmation = 'You are checked in. Please return to the event page for next steps.',
}: GuestEventCheckInProps) {
  const navigate = useNavigate();
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const storageKey = useCallback((evId: string) => {
    return checkInCode ? `qme:eventCheckIn:${checkInCode}:${evId}` : `qme:eventCheckIn:${evId}`;
  }, [checkInCode]);

  useEffect(() => {
    if (!eventSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const stored = localStorage.getItem(storageKey(ev.id));
        if (stored) {
          const saved = JSON.parse(stored) as { id?: string; firstName?: string; lastName?: string; contact?: string };
          setFirstName(saved.firstName || '');
          setLastName(saved.lastName || '');
          setContact(saved.contact || '');
          setSubmitted(true);
          if (saved.id) {
            try {
              const row = await getEventCheckIn(saved.id);
              const config = getEventCheckInConfig(ev);
              setCheckIn(config.completionMode === 'auto' && row.status !== 'completed'
                ? await checkInEventGuest(row.id, row.ticket_type ?? 'general')
                : row);
            } catch { /* keep local confirmation even if fetch fails */ }
          }
        }
      } catch (e) {
        console.error('Failed to load event check-in', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, storageKey]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    const checkInConfig = getEventCheckInConfig(event);
    const shouldAutoComplete = checkInConfig.completionMode === 'auto';
    setSaving(true);
    setError('');
    try {
      const trimmedContact = contact.trim();
      const contactIsEmail = trimmedContact.includes('@');
      const created = await createEventCheckIn({
        event_id: event.id,
        first_name: firstName,
        last_name: lastName,
        code: checkInCode,
        email: contactIsEmail ? trimmedContact : null,
        phone: trimmedContact && !contactIsEmail ? trimmedContact : null,
      });
      const row = shouldAutoComplete
        ? await checkInEventGuest(created.id, 'general')
        : created;
      localStorage.setItem(storageKey(event.id), JSON.stringify({
        id: row.id,
        firstName,
        lastName,
        contact: trimmedContact,
        ts: Date.now(),
      }));
      setCheckIn(row);
      setSubmitted(true);
    } catch (err) {
      console.error('Check-in failed', err);
      setError('Check-in could not be saved. Please see the mobile bar team.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!event || !submitted) return;
    const stored = localStorage.getItem(storageKey(event.id));
    if (!stored) return;
    const saved = JSON.parse(stored) as { id?: string };
    if (!saved.id) return;

    let stopped = false;
    async function refreshCheckIn() {
      try {
        const row = await getEventCheckIn(saved.id!);
        if (!stopped) setCheckIn(row);
      } catch { /* */ }
    }
    refreshCheckIn();
    const interval = setInterval(refreshCheckIn, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [event, submitted, storageKey]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Event not found.</p>
      </div>
    );
  }

  const checkInConfig = getEventCheckInConfig(event);
  const isWaitingForHostCheckIn = submitted
    && checkInConfig.requireCompletedForParticipation
    && checkIn?.status !== 'completed';
  const eventLogoSrc = event.slug === 'sotc-test-check-in' || eventSlug === 'sotc-test-check-in'
    ? '/images/sotc-logo.png'
    : event.image_url || '/images/qmeFirstLogo.jpg';

  if (!checkInConfig.enabled) {
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header
          logoSrc={eventLogoSrc}
          titleLine1="EVENT"
          titleLine2="INFO"
        />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', textAlign: 'center' }}>
          <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>
            Check-in is not needed
          </h1>
          <p style={{ color: '#666', lineHeight: 1.5, marginTop: 0 }}>
            This event does not require guest check-in before viewing or joining activities.
          </p>
          <button
            className="actionBtn actionBtn-secondary"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate(`/events/${eventSlug}`)}
          >
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={eventLogoSrc}
        titleLine1="CHECK"
        titleLine2="IN"
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>
          {title}
        </h1>
        <p style={{ color: '#666', lineHeight: 1.5, marginTop: 0 }}>
          {intro}
        </p>

        {submitted ? (
          <>
            <div
              style={{
                background: isWaitingForHostCheckIn ? '#fffbeb' : '#E8F5E9',
                border: `1px solid ${isWaitingForHostCheckIn ? '#fde68a' : '#c8e6c9'}`,
                borderRadius: 10,
                padding: '1rem',
                margin: '1rem 0',
                color: isWaitingForHostCheckIn ? '#92400e' : '#1B5E20',
                fontWeight: 700,
                lineHeight: 1.45,
              }}
            >
              {isWaitingForHostCheckIn
                ? `Thanks, ${firstName || 'guest'}. Your name has been submitted. Please wait for the host to officially check you in before using event features.`
                : `Thanks, ${firstName || 'guest'}! ${confirmation}`}
            </div>
            {!checkInCode && checkIn?.ticket_type === 'flowers' && (
              <div style={{ background: '#F0EEFF', borderRadius: 12, padding: '1rem', margin: '1rem 0', color: '#2f275f', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
                  Festival + Flowers Access
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, marginTop: 4 }}>
                  Bouquet Bar Ready
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: 6, lineHeight: 1.4 }}>
                  Return to the event page and choose Bouquet Bar when you are ready.
                </div>
                <button
                  className="actionBtn actionBtn-primary"
                  style={{ margin: '0.85rem 0 0' }}
                  onClick={() => navigate(`/events/${eventSlug}`)}
                >
                  Back to Event
                </button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 700 }}>
                {error}
              </div>
            )}
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.9rem' }}
            />

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }}
            />

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Email or phone <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span></label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              inputMode="email"
              autoComplete="email tel"
              placeholder="For recovering your check-in later"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }}
            />

            <button className="actionBtn actionBtn-primary" type="submit" style={{ margin: 0 }} disabled={saving}>
              {saving ? 'Checking In...' : 'Check In'}
            </button>
          </form>
        )}

        <button
          className="actionBtn actionBtn-secondary"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate(`/events/${eventSlug}`)}
        >
          Back to Event
        </button>
      </div>
    </div>
  );
}
