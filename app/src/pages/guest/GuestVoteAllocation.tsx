import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEventBySlug } from '../../lib/eventService';
import { listActiveEcesForEvent } from '../../lib/eceService';
import { getEventCheckIn } from '../../lib/checkInService';
import { getVoteAllocationConfig, normalizeVoteAllocation, totalAllocatedVotes } from '../../lib/votingConfig';
import type { Ece, EventCheckIn, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

function storedCheckInKey(eventId: string) {
  return `qme:eventCheckIn:${eventId}`;
}

function voteStorageKey(eventId: string, eceId: string, checkInId: string) {
  return `qme:voteAllocation:${eventId}:${eceId}:${checkInId}`;
}

function getStoredAllocation(eventId: string, eceId: string, checkInId: string): Record<string, number> {
  try {
    const stored = localStorage.getItem(voteStorageKey(eventId, eceId, checkInId));
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, number>
      : {};
  } catch {
    return {};
  }
}

export default function GuestVoteAllocation() {
  const navigate = useNavigate();
  const { eventSlug, eceSlug } = useParams<{ eventSlug: string; eceSlug: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [ece, setEce] = useState<Ece | null>(null);
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [allocation, setAllocation] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!eventSlug || !eceSlug) return;
    let stopped = false;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        const eces = await listActiveEcesForEvent(ev.id);
        const foundEce = eces.find((item) => item.slug === eceSlug) ?? null;
        let foundCheckIn: EventCheckIn | null = null;
        if (foundEce) {
          const stored = localStorage.getItem(storedCheckInKey(ev.id));
          const saved = stored ? JSON.parse(stored) as { id?: string } : {};
          if (saved.id) {
            try {
              const row = await getEventCheckIn(saved.id, ev.id);
              foundCheckIn = row.status === 'completed' ? row : null;
            } catch {
              foundCheckIn = null;
            }
          }
        }
        if (stopped) return;
        setEvent(ev);
        setEce(foundEce);
        setCheckIn(foundCheckIn);
        if (foundEce && foundCheckIn) {
          setAllocation(getStoredAllocation(ev.id, foundEce.id, foundCheckIn.id));
        }
      } catch (error) {
        console.error('Failed to load voting activity', error);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, [eventSlug, eceSlug]);

  const config = useMemo(() => getVoteAllocationConfig(ece), [ece]);
  const normalizedAllocation = useMemo(
    () => normalizeVoteAllocation(allocation, config.choices, config.creditLimit),
    [allocation, config.choices, config.creditLimit]
  );
  const allocatedTotal = totalAllocatedVotes(normalizedAllocation);
  const remainingVotes = Math.max(0, config.creditLimit - allocatedTotal);

  function updateChoice(choiceId: string, nextValue: number) {
    if (!event || !ece || !checkIn || !config.open) return;
    setMessage('');
    setAllocation((current) => {
      const next = normalizeVoteAllocation({
        ...current,
        [choiceId]: Math.max(0, Math.floor(nextValue)),
      }, config.choices, config.creditLimit);
      localStorage.setItem(voteStorageKey(event.id, ece.id, checkIn.id), JSON.stringify(next));
      return next;
    });
  }

  function saveVotes() {
    if (!event || !ece || !checkIn) return;
    localStorage.setItem(voteStorageKey(event.id, ece.id, checkIn.id), JSON.stringify(normalizedAllocation));
    setMessage('Your votes are saved on this device for the prototype.');
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (!event || !ece || !config.enabled) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem' }}>Voting unavailable</h1>
        <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate(`/events/${eventSlug}`)}>
          Back to Event
        </button>
      </div>
    );
  }

  if (!checkIn) {
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header logoSrc={event.image_url || '/images/qmeFirstLogo.jpg'} titleLine1="VOTE" titleLine2="qME" />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', textAlign: 'center' }}>
          <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{ece.name}</h1>
          <p style={{ color: '#64748b', lineHeight: 1.5, fontWeight: 700 }}>
            Complete event check-in before voting.
          </p>
          <Link className="actionBtn actionBtn-primary" to={`/events/${event.slug}/check-in`}>
            Event Check-In
          </Link>
          <Link className="actionBtn actionBtn-secondary" to={`/events/${event.slug}`}>
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={event.image_url || '/images/qmeFirstLogo.jpg'} titleLine1="VOTE" titleLine2="qME" />
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{ece.name}</h1>
        <p style={{ color: '#64748b', lineHeight: 1.5, fontWeight: 700, marginTop: 0 }}>
          Use your {config.creditLimit} digital balls. You can put both on one choice or split them while voting is open.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', margin: '1rem 0', flexWrap: 'wrap' }}>
          <div style={{ color: '#1f2937', fontWeight: 900 }}>Remaining: {remainingVotes}</div>
          <div style={{ color: config.open ? '#047857' : '#9a3412', fontWeight: 900 }}>
            {config.open ? 'Voting open' : 'Voting closed'}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {config.choices.map((choice) => {
            const count = normalizedAllocation[choice.id] ?? 0;
            return (
              <div key={choice.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#1f2937', fontWeight: 900, fontSize: '1.05rem' }}>{choice.name}</div>
                    <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.4, margin: '0.35rem 0 0' }}>{choice.description}</p>
                  </div>
                  <div style={{ color: '#4338ca', fontWeight: 900, whiteSpace: 'nowrap' }}>{count} balls</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    className="actionBtn actionBtn-secondary"
                    type="button"
                    disabled={!config.open || count <= 0}
                    onClick={() => updateChoice(choice.id, count - 1)}
                    style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                  >
                    -
                  </button>
                  <button
                    className="actionBtn actionBtn-primary"
                    type="button"
                    disabled={!config.open || remainingVotes <= 0}
                    onClick={() => updateChoice(choice.id, count + 1)}
                    style={{ margin: 0, width: 'auto', padding: '0.45rem 0.8rem' }}
                  >
                    Add Ball
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button className="actionBtn actionBtn-primary" type="button" disabled={!config.open} onClick={saveVotes}>
          Save Votes
        </button>
        {message && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontWeight: 800, padding: '0.75rem', marginTop: '0.75rem' }}>
            {message}
          </div>
        )}

        {config.resultsVisible ? (
          <div style={{ marginTop: '1.25rem' }}>
            <h2 style={{ color: '#1f2937', fontSize: '1rem', marginBottom: '0.75rem' }}>Results Reveal</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.55rem', alignItems: 'end' }}>
              {config.choices.map((choice) => {
                const count = normalizedAllocation[choice.id] ?? 0;
                return (
                  <div key={choice.id} style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ height: 120, border: '2px solid #cbd5e1', borderRadius: '0 0 12px 12px', display: 'flex', flexDirection: 'column-reverse', gap: 4, padding: 6, background: 'rgba(241,245,249,0.7)' }}>
                      {Array.from({ length: count }).map((_, index) => (
                        <span key={index} style={{ width: 18, height: 18, borderRadius: 999, background: '#4f46e5', alignSelf: 'center', display: 'block' }} />
                      ))}
                    </div>
                    <div style={{ color: '#334155', fontSize: '0.72rem', fontWeight: 900, marginTop: 6, overflowWrap: 'anywhere' }}>{choice.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.4, marginTop: '1rem' }}>
            Aggregate results are hidden until the event team reveals them.
          </p>
        )}

        <Link className="actionBtn actionBtn-secondary" to={`/events/${event.slug}`}>
          Back to Event
        </Link>
      </div>
    </div>
  );
}
