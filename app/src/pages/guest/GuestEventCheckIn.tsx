/**
 * Guest: Event check-in landing page.
 * First alpha pass: gives the event QR a clear "start here" destination.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  checkInEventGuest,
  createEventCheckIn,
  createImportedRegistrationCheckInForGuest,
  getEventCheckIn,
  searchImportedRegistrationsForGuest,
} from '../../lib/checkInService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getEventBySlug } from '../../lib/eventService';
import type { EventCheckIn, ImportedRegistrationSearchResult, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

interface GuestEventCheckInProps {
  checkInCode?: string | null;
  title?: string;
  intro?: string;
  confirmation?: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (hasLeadingPlus && digits) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

function isValidPhone(value: string) {
  const normalized = normalizePhone(value);
  if (normalized.startsWith('+')) {
    const digits = normalized.slice(1);
    return digits.length >= 8 && digits.length <= 15;
  }
  return normalized.length === 10;
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [registrationQuery, setRegistrationQuery] = useState('');
  const [registrationResults, setRegistrationResults] = useState<ImportedRegistrationSearchResult[]>([]);
  const [registrationSearching, setRegistrationSearching] = useState(false);
  const [registrationEmailConfirmation, setRegistrationEmailConfirmation] = useState<Record<string, string>>({});
  const [registrationHasSearched, setRegistrationHasSearched] = useState(false);
  const useImportedRegistrationLookup = !checkInCode && event?.slug === 'sotc-test-check-in';

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
          const saved = JSON.parse(stored) as {
            id?: string;
            firstName?: string;
            lastName?: string;
            contact?: string;
            email?: string;
            phone?: string;
          };
          setFirstName(saved.firstName || '');
          setLastName(saved.lastName || '');
          if (saved.email || saved.phone) {
            setEmail(saved.email || '');
            setPhone(saved.phone || '');
          } else if (saved.contact) {
            setEmail(saved.contact.includes('@') ? saved.contact : '');
            setPhone(saved.contact.includes('@') ? '' : saved.contact);
          }
          setSubmitted(true);
          if (saved.id) {
            try {
              const row = await getEventCheckIn(saved.id, ev.id);
              const config = getEventCheckInConfig(ev);
              setCheckIn(config.completionMode === 'auto' && row.status !== 'completed'
                ? await checkInEventGuest(row.id, row.ticket_type ?? 'general', ev.id)
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
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();
      const normalizedPhone = normalizePhone(trimmedPhone);
      if (trimmedEmail && !isValidEmail(trimmedEmail)) {
        setError('Please enter a valid email address or leave email blank.');
        return;
      }
      if (trimmedPhone && !isValidPhone(trimmedPhone)) {
        setError('Please enter a 10-digit U.S. phone number, an international number starting with +, or leave phone blank.');
        return;
      }
      const created = await createEventCheckIn({
        event_id: event.id,
        first_name: firstName,
        last_name: lastName,
        code: checkInCode,
        email: trimmedEmail || null,
        phone: normalizedPhone || null,
      });
      const row = shouldAutoComplete
        ? await checkInEventGuest(created.id, 'general', event.id)
        : created;
      localStorage.setItem(storageKey(event.id), JSON.stringify({
        id: row.id,
        firstName,
        lastName,
        email: trimmedEmail,
        phone: normalizedPhone,
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
    const eventId = event.id;

    let stopped = false;
    async function refreshCheckIn() {
      try {
        const row = await getEventCheckIn(saved.id!, eventId);
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

  const searchImportedRegistrations = useCallback(async (query: string, options?: { showShortQueryError?: boolean }) => {
    if (!event) return;
    const trimmedQuery = query.trim();
    setRegistrationHasSearched(true);
    if (trimmedQuery.length < 2) {
      setRegistrationResults([]);
      if (options?.showShortQueryError) {
        setError('Type at least two letters of your name to search.');
      }
      return;
    }
    setError('');
    setRegistrationSearching(true);
    try {
      const results = await searchImportedRegistrationsForGuest(event.id, trimmedQuery);
      setRegistrationResults(results);
      if (results.length === 0) {
        setError('No matching registration was found. Try your first or last name, or see the event team.');
      }
    } catch (err) {
      console.error('Registration search failed', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message || '').toLowerCase()
        : '';
      if (message.includes('could not find the function') || message.includes('does not exist')) {
        setError('Registration lookup is still being set up. Please see the event team.');
      } else {
        setError('Registration search is not available right now. Please see the event team.');
      }
    } finally {
      setRegistrationSearching(false);
    }
  }, [event]);

  useEffect(() => {
    if (!event || submitted || !useImportedRegistrationLookup) return;
    const query = registrationQuery.trim();
    if (query.length < 2) {
      setRegistrationResults([]);
      if (registrationHasSearched) setError('');
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchImportedRegistrations(query);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [
    event,
    registrationHasSearched,
    registrationQuery,
    searchImportedRegistrations,
    submitted,
    useImportedRegistrationLookup,
  ]);

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

  async function handleRegistrationSearch(e: FormEvent) {
    e.preventDefault();
    await searchImportedRegistrations(registrationQuery, { showShortQueryError: true });
  }

  async function claimImportedRegistration(result: ImportedRegistrationSearchResult) {
    if (!event) return;
    setSaving(true);
    setError('');
    try {
      const trimmedPhone = phone.trim();
      const normalizedPhone = normalizePhone(trimmedPhone);
      if (trimmedPhone && !isValidPhone(trimmedPhone)) {
        setError('Please enter a 10-digit U.S. phone number, an international number starting with +, or leave phone blank.');
        return;
      }
      const row = await createImportedRegistrationCheckInForGuest({
        eventId: event.id,
        importedRegistrationId: result.id,
        emailConfirmation: registrationEmailConfirmation[result.id] || null,
        phone: normalizedPhone || null,
      });
      setFirstName(row.first_name);
      setLastName(row.last_name);
      localStorage.setItem(storageKey(event.id), JSON.stringify({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: normalizedPhone,
        importedRegistrationId: result.id,
        ts: Date.now(),
      }));
      setCheckIn(row);
      setSubmitted(true);
    } catch (err) {
      console.error('Imported registration check-in failed', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message || '')
        : '';
      if (message.toLowerCase().includes('email confirmation')) {
        setError('Please confirm the email address used for this registration.');
      } else if (message.toLowerCase().includes('already been checked in')) {
        setError('This registration has already been checked in. Please see the event team if this is you.');
      } else {
        setError('Check-in could not be saved. Please see the event team.');
      }
    } finally {
      setSaving(false);
    }
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
        ) : useImportedRegistrationLookup ? (
          <div>
            {error && (
              <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 700 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleRegistrationSearch}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                Find your registration
              </label>
              <input
                value={registrationQuery}
                onChange={(e) => setRegistrationQuery(e.target.value)}
                placeholder="Type your first or last name"
                autoComplete="name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.5rem' }}
              />
              <button className="actionBtn actionBtn-primary" type="submit" style={{ margin: '0.5rem 0 1rem' }} disabled={registrationSearching}>
                {registrationSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
              Phone <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="216-555-0100"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.35rem' }}
            />
            <div style={{ color: '#777', fontSize: '0.8rem', lineHeight: 1.35, marginBottom: '1rem' }}>
              Optional. Used only to help recover your check-in later.
            </div>

            {registrationResults.map((result) => (
              <div
                key={result.id}
                className="registration-result-card"
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 10,
                  padding: '0.85rem',
                  marginBottom: '0.75rem',
                  background: result.already_checked_in ? '#f8fafc' : '#fff',
                }}
              >
                <div className="registration-result-row">
                  <div>
                    <div style={{ color: '#223247', fontWeight: 900, fontSize: '1.05rem' }}>
                      {result.first_name} {result.last_name}
                    </div>
                    {result.email_hint && (
                      <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 3 }}>
                        Email hint: {result.email_hint}
                      </div>
                    )}
                    <div style={{ color: result.headshot_entitled ? '#00a344' : '#64748b', fontSize: '0.78rem', fontWeight: 900, marginTop: 5 }}>
                      {result.headshot_entitled ? 'Headshot included' : 'Event admission'}
                    </div>
                  </div>
                  <button
                    className={result.already_checked_in ? 'actionBtn actionBtn-secondary' : 'actionBtn actionBtn-primary'}
                    type="button"
                    disabled={saving || result.already_checked_in}
                    onClick={() => claimImportedRegistration(result)}
                    style={{ margin: 0 }}
                  >
                    {result.already_checked_in ? 'Checked In' : 'This is me'}
                  </button>
                </div>
                {result.requires_email_confirmation && !result.already_checked_in && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                      Confirm your email
                    </label>
                    <input
                      value={registrationEmailConfirmation[result.id] || ''}
                      onChange={(e) => setRegistrationEmailConfirmation((current) => ({
                        ...current,
                        [result.id]: e.target.value,
                      }))}
                      inputMode="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: 8, border: '1px solid #ddd' }}
                    />
                    <div style={{ color: '#777', fontSize: '0.78rem', lineHeight: 1.35, marginTop: 5 }}>
                      More than one registration has this name, so we need the matching email.
                    </div>
                  </div>
                )}
              </div>
            ))}

            <details style={{ marginTop: '1rem', color: '#666' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Can&apos;t find your registration?</summary>
              <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
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

                <button className="actionBtn actionBtn-primary" type="submit" style={{ margin: 0 }} disabled={saving}>
                  {saving ? 'Submitting...' : 'Ask event team for help'}
                </button>
              </form>
            </details>
          </div>
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

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Email <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span></label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.35rem' }}
            />
            <div style={{ color: '#777', fontSize: '0.8rem', lineHeight: 1.35, marginBottom: '0.9rem' }}>
              Optional. Used only to help recover your check-in later.
            </div>

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Phone <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span></label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="216-555-0100"
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.35rem' }}
            />
            <div style={{ color: '#777', fontSize: '0.8rem', lineHeight: 1.35, marginBottom: '1rem' }}>
              Optional. Used only to help recover your check-in later.
            </div>

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
