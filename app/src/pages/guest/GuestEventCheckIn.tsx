/**
 * Guest: Event check-in landing page.
 * First alpha pass: gives the event QR a clear "start here" destination.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  checkInEventGuest,
  createEventCheckIn,
  createImportedRegistrationCheckInForGuest,
  getEventCheckIn,
  reconnectImportedRegistrationCheckInForGuest,
  searchImportedRegistrationsForGuest,
} from '../../lib/checkInService';
import { formatCompletedCheckInConfirmation, formatTotalGuests, getCheckInPartySize, getSearchResultPartySize } from '../../lib/checkInPartySize';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getEventBySlug } from '../../lib/eventService';
import { buildGuestEventThemeStyle, getGuestEventTheme, hasGuestEventTheme } from '../../lib/eventTheme';
import { clearGuestSessionToken } from '../../lib/guestSessionService';
import { isSotcEventSlug } from '../../lib/sotc';
import type { EventCheckIn, ImportedRegistrationSearchResult, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

const SHARED_DEVICE_RESET_SECONDS = 15;

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
  confirmation = 'You are checked in. Return to the event page for next steps.',
}: GuestEventCheckInProps) {
  const navigate = useNavigate();
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [searchParams] = useSearchParams();
  const isSharedDeviceMode = searchParams.get('mode') === 'shared' || searchParams.get('shared') === '1';
  const [event, setEvent] = useState<QEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
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
  const [selfRegistrationEmailError, setSelfRegistrationEmailError] = useState('');
  const [sharedDeviceResetSeconds, setSharedDeviceResetSeconds] = useState(SHARED_DEVICE_RESET_SECONDS);
  const checkInConfig = getEventCheckInConfig(event);
  const useImportedRegistrationLookup = !checkInCode
    && (checkInConfig.importedRegistrationLookupEnabled || isSotcEventSlug(event?.slug));
  const useSelfRegistrationFallback = useImportedRegistrationLookup && checkInConfig.selfRegistrationFallbackEnabled;
  const selfRegistrationRequiresEmail = checkInConfig.selfRegistrationRequiredFields.includes('email');
  const pageIntro = useImportedRegistrationLookup && isSotcEventSlug(event?.slug)
    ? 'Find your registration to self check in. After checking in, stop at the registration desk to pick up your name tag.'
    : useImportedRegistrationLookup
    ? 'Find your registration to self check in.'
    : intro;
  const completedInstruction = checkInConfig.postCheckInInstruction
    || confirmation.replace(/^You are checked in\.\s*/i, '');
  const checkInPartySize = getCheckInPartySize(checkIn);

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
            setEmailConfirmation(saved.email || '');
            setPhone(saved.phone || '');
          } else if (saved.contact) {
            setEmail(saved.contact.includes('@') ? saved.contact : '');
            setEmailConfirmation(saved.contact.includes('@') ? saved.contact : '');
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
    setSelfRegistrationEmailError('');
    try {
      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();
      const normalizedPhone = normalizePhone(trimmedPhone);
      if (trimmedEmail && !isValidEmail(trimmedEmail)) {
        setError('Please enter a valid email address or leave email blank.');
        return;
      }
      if (selfRegistrationRequiresEmail && !trimmedEmail) {
        setError('Please enter the email address for this registration.');
        return;
      }
      if (selfRegistrationRequiresEmail && trimmedEmail.toLowerCase() !== emailConfirmation.trim().toLowerCase()) {
        setSelfRegistrationEmailError('Email and confirm email must match.');
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
        needsHelp: useImportedRegistrationLookup && !useSelfRegistrationFallback,
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
      setError('Check-in could not be saved. Please see the event team.');
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
        setError(useSelfRegistrationFallback
          ? 'No matching registration was found. Try your first or last name, or register below.'
          : 'No matching registration was found. Try your first or last name, or see the event team.');
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
  }, [event, useSelfRegistrationFallback]);

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

  const isRemovedCheckIn = checkIn?.status === 'cancelled';
  const isWaitingForHostCheckIn = submitted
    && checkInConfig.requireCompletedForParticipation
    && checkIn?.status !== 'completed'
    && !isRemovedCheckIn;

  useEffect(() => {
    if (!isSharedDeviceMode || !submitted || isRemovedCheckIn) {
      setSharedDeviceResetSeconds(SHARED_DEVICE_RESET_SECONDS);
      return;
    }

    setSharedDeviceResetSeconds(SHARED_DEVICE_RESET_SECONDS);
    const interval = window.setInterval(() => {
      setSharedDeviceResetSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          clearSharedDeviceGuest();
          return SHARED_DEVICE_RESET_SECONDS;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [event, isRemovedCheckIn, isSharedDeviceMode, submitted]);

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
      const input = {
        eventId: event.id,
        importedRegistrationId: result.id,
        emailConfirmation: registrationEmailConfirmation[result.id] || null,
        phone: normalizedPhone || null,
      };
      const row = result.already_checked_in
        ? await reconnectImportedRegistrationCheckInForGuest(input)
        : await createImportedRegistrationCheckInForGuest(input);
      const resultPartySize = getSearchResultPartySize(result);
      const displayRow = resultPartySize > 1 && getCheckInPartySize(row) === 1
        ? { ...row, metadata: { ...(row.metadata ?? {}), party_size: resultPartySize } }
        : row;
      setFirstName(row.first_name);
      setLastName(row.last_name);
      localStorage.setItem(storageKey(event.id), JSON.stringify({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: normalizedPhone,
        partySize: getCheckInPartySize(displayRow),
        importedRegistrationId: result.id,
        recovered: result.already_checked_in,
        ts: Date.now(),
      }));
      setCheckIn(displayRow);
      setSubmitted(true);
    } catch (err) {
      console.error('Imported registration check-in failed', err);
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message || '')
        : '';
      if (message.toLowerCase().includes('email confirmation')) {
        setError('Please confirm the email address used for this registration.');
      } else if (message.toLowerCase().includes('already been checked in')) {
        setError('This registration is already checked in. Use Reconnect to My Event if this is you, or see the event team.');
      } else if (message.toLowerCase().includes('removed')) {
        setError('This check-in was removed by the event team. Please check in again or see the event team.');
      } else {
        setError('Check-in could not be saved. Please see the event team.');
      }
    } finally {
      setSaving(false);
    }
  }

  function resetCancelledCheckIn() {
    if (!event) return;
    try {
      localStorage.removeItem(storageKey(event.id));
    } catch {
      /* continue with in-memory reset if browser storage is unavailable */
    }
    setSubmitted(false);
    setCheckIn(null);
    setError('');
  }

  function clearSharedDeviceGuest() {
    if (!event) return;
    try {
      localStorage.removeItem(storageKey(event.id));
      clearGuestSessionToken(event.id);
      const votePrefix = `qme:voteAllocation:${event.id}:`;
      Object.keys(localStorage)
        .filter((key) => key.startsWith(votePrefix))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      /* continue with in-memory reset if browser storage is unavailable */
    }
    setFirstName('');
    setLastName('');
    setEmail('');
    setEmailConfirmation('');
    setPhone('');
    setSubmitted(false);
    setCheckIn(null);
    setSaving(false);
    setError('');
    setRegistrationQuery('');
    setRegistrationResults([]);
    setRegistrationSearching(false);
    setRegistrationEmailConfirmation({});
    setRegistrationHasSearched(false);
    setSelfRegistrationEmailError('');
    setSharedDeviceResetSeconds(SHARED_DEVICE_RESET_SECONDS);
  }

  const eventLogoSrc = isSotcEventSlug(event.slug) || isSotcEventSlug(eventSlug)
    ? '/images/sotc-logo.png'
    : event.image_url || '/images/qmeFirstLogo.jpg';
  const guestTheme = getGuestEventTheme(event);
  const isThemed = hasGuestEventTheme(guestTheme);
  const guestThemeStyle = buildGuestEventThemeStyle(guestTheme);

  if (!checkInConfig.enabled) {
    return (
      <div
        className={`card card-scrollable guest-event-card ${isThemed ? 'guest-event-themed' : ''}`}
        style={{ minHeight: '600px', maxHeight: '90vh', ...guestThemeStyle }}
      >
        <Header
          logoSrc={eventLogoSrc}
          titleLine1="EVENT"
          titleLine2="INFO"
          hideMenu={isSharedDeviceMode}
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
    <div
      className={`card card-scrollable guest-event-card ${isThemed ? 'guest-event-themed' : ''}`}
      style={{ minHeight: '600px', maxHeight: '90vh', ...guestThemeStyle }}
    >
      <Header
        logoSrc={eventLogoSrc}
        titleLine1="CHECK"
        titleLine2="IN"
        hideMenu={isSharedDeviceMode}
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>
          {title}
        </h1>
        <p style={{ color: '#666', lineHeight: 1.5, marginTop: 0 }}>
          {pageIntro}
        </p>

        {submitted ? (
          <>
            <div
              style={{
                background: isRemovedCheckIn ? '#fff7ed' : isWaitingForHostCheckIn ? '#fffbeb' : '#E8F5E9',
                border: `1px solid ${isRemovedCheckIn ? '#fdba74' : isWaitingForHostCheckIn ? '#fde68a' : '#c8e6c9'}`,
                borderRadius: 10,
                padding: '1rem',
                margin: '1rem 0',
                color: isRemovedCheckIn ? '#9a3412' : isWaitingForHostCheckIn ? '#92400e' : '#1B5E20',
                fontWeight: 700,
                lineHeight: 1.45,
              }}
            >
              {isRemovedCheckIn
                ? 'This check-in request was removed by the event team. Please check in again or see the event team for help.'
                : isWaitingForHostCheckIn
                ? `Thanks, ${firstName || 'guest'}. Your name has been submitted. Please wait for the host to officially check you in before using event features.`
                : formatCompletedCheckInConfirmation(firstName, checkInPartySize, completedInstruction)}
            </div>
            {!isRemovedCheckIn && !isWaitingForHostCheckIn && (
              <div style={{ color: '#223247', fontWeight: 900, margin: '0.2rem 0 0.75rem', textAlign: 'center' }}>
                {formatTotalGuests(checkInPartySize)}
              </div>
            )}
            {isRemovedCheckIn && (
              <button
                className="actionBtn actionBtn-primary"
                type="button"
                style={{ margin: '0.5rem 0 1rem' }}
                onClick={resetCancelledCheckIn}
              >
                Check In Again
              </button>
            )}
            {isSharedDeviceMode && !isRemovedCheckIn && (
              <>
                <div style={{ color: '#334155', fontWeight: 900, margin: '0.2rem 0 0.75rem', textAlign: 'center' }}>
                  Next guest in {sharedDeviceResetSeconds} seconds...
                </div>
                <button
                  className="actionBtn actionBtn-primary"
                  type="button"
                  style={{ margin: '0.5rem 0 1rem' }}
                  onClick={clearSharedDeviceGuest}
                >
                  Next Guest
                </button>
              </>
            )}
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
                placeholder="First name, last name, or email"
                autoComplete="name"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.5rem' }}
              />
              <button className="actionBtn actionBtn-primary" type="submit" style={{ margin: '0.5rem 0 1rem' }} disabled={registrationSearching}>
                {registrationSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
              Recovery phone <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span>
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
              Optional. Used only to help recover your check-in later, not to search the imported list.
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
                    {result.ticket_hint && (
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 3 }}>
                        Registration: {result.ticket_hint}
                      </div>
                    )}
                    <div style={{ color: result.headshot_entitled ? '#00a344' : '#64748b', fontSize: '0.78rem', fontWeight: 900, marginTop: 5 }}>
                      {result.headshot_entitled ? 'Headshot included' : 'Event admission'}
                    </div>
                  </div>
                  <button
                    className={result.already_checked_in ? 'actionBtn actionBtn-secondary' : 'actionBtn actionBtn-primary'}
                    type="button"
                    disabled={saving}
                    onClick={() => claimImportedRegistration(result)}
                    style={{ margin: 0 }}
                  >
                    {result.already_checked_in ? 'Reconnect to My Event' : 'This is me'}
                  </button>
                </div>
                {result.requires_email_confirmation && (
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
                {useSelfRegistrationFallback && (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.45, margin: '0 0 1rem' }}>
                    Please provide your information below to register for the event and check in now.
                  </p>
                )}
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  aria-label="First name"
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.9rem' }}
                />

                <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  aria-label="Last name"
                  required
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }}
                />

                {useSelfRegistrationFallback && (
                  <>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                      Email {selfRegistrationRequiresEmail ? null : <span style={{ color: '#888', fontWeight: 500 }}>(optional)</span>}
                    </label>
                    <input
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (selfRegistrationEmailError) setSelfRegistrationEmailError('');
                      }}
                      aria-label="Email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      required={selfRegistrationRequiresEmail}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '0.35rem' }}
                    />
                    {selfRegistrationRequiresEmail && (
                      <>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: 6 }}>
                          Confirm email
                        </label>
                        <input
                          value={emailConfirmation}
                          onChange={(e) => {
                            setEmailConfirmation(e.target.value);
                            if (selfRegistrationEmailError) setSelfRegistrationEmailError('');
                          }}
                          aria-label="Confirm email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          required
                          aria-invalid={Boolean(selfRegistrationEmailError)}
                          aria-describedby={selfRegistrationEmailError ? 'self-registration-email-error' : undefined}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem',
                            borderRadius: 8,
                            border: `1px solid ${selfRegistrationEmailError ? '#B71C1C' : '#ddd'}`,
                            marginBottom: '0.35rem',
                          }}
                        />
                      </>
                    )}
                    {selfRegistrationEmailError && (
                      <div
                        id="self-registration-email-error"
                        role="alert"
                        style={{ color: '#B71C1C', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.35, marginBottom: '0.5rem' }}
                      >
                        {selfRegistrationEmailError}
                      </div>
                    )}
                    <div style={{ color: '#777', fontSize: '0.8rem', lineHeight: 1.35, marginBottom: '1rem' }}>
                      Used only for this event registration and check-in recovery.
                    </div>
                  </>
                )}

                <button className="actionBtn actionBtn-primary" type="submit" style={{ margin: 0 }} disabled={saving}>
                  {saving ? 'Submitting...' : useSelfRegistrationFallback ? 'Register & Check In' : 'Ask event team for help'}
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
