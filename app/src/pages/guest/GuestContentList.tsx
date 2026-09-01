import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getContentListConfig } from '../../lib/contentListConfig';
import { getEventCheckIn } from '../../lib/checkInService';
import { listActiveEcesForEvent } from '../../lib/eceService';
import { getEventBySlug } from '../../lib/eventService';
import { isSotcEventSlug } from '../../lib/sotc';
import type { Ece, EventCheckIn, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

export default function GuestContentList() {
  const navigate = useNavigate();
  const { eventSlug, eceSlug, itemSlug } = useParams<{ eventSlug: string; eceSlug: string; itemSlug?: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [ece, setEce] = useState<Ece | null>(null);
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [committedVotes, setCommittedVotes] = useState<string[]>([]);
  const [pendingVoteItemId, setPendingVoteItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventSlug || !eceSlug) return;
    let stopped = false;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        const eces = await listActiveEcesForEvent(ev.id);
        if (stopped) return;
        setEvent(ev);
        const selectedEce = eces.find((item) => item.slug === eceSlug) ?? null;
        setEce(selectedEce);
        const storedCheckIn = localStorage.getItem(`qme:eventCheckIn:${ev.id}`);
        if (storedCheckIn) {
          try {
            const saved = JSON.parse(storedCheckIn) as { id?: string };
            if (saved.id) {
              const row = await getEventCheckIn(saved.id, ev.id);
              if (!stopped) setCheckIn(row);
            }
          } catch {
            if (!stopped) setCheckIn(null);
          }
        }
      } catch (error) {
        console.error('Failed to load content list', error);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, [eventSlug, eceSlug]);

  const config = useMemo(() => getContentListConfig(ece), [ece]);
  const selectedItem = useMemo(() => (
    itemSlug ? config.items.find((item) => item.slug === itemSlug || item.id === itemSlug) ?? null : null
  ), [config.items, itemSlug]);
  const eventLogoSrc = isSotcEventSlug(event?.slug)
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';
  const voteStorageKey = event && ece && checkIn
    ? `qme:contentVotes:${event.id}:${ece.id}:${checkIn.id}`
    : '';
  const votesRemaining = Math.max(config.voting.creditLimit - committedVotes.length, 0);
  const selectedItemVoteCount = selectedItem
    ? committedVotes.filter((id) => id === selectedItem.id).length
    : 0;
  const canVote = config.voting.enabled && config.voting.open && checkIn?.status === 'completed' && votesRemaining > 0;

  useEffect(() => {
    if (!voteStorageKey) {
      setCommittedVotes([]);
      return;
    }
    try {
      const stored = localStorage.getItem(voteStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setCommittedVotes(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
    } catch {
      setCommittedVotes([]);
    }
  }, [voteStorageKey]);

  function confirmVote(itemId: string) {
    if (!voteStorageKey || !canVote) return;
    const nextVotes = [...committedVotes, itemId].slice(0, config.voting.creditLimit);
    localStorage.setItem(voteStorageKey, JSON.stringify(nextVotes));
    setCommittedVotes(nextVotes);
    setPendingVoteItemId(null);
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
        <h1 className="headline" style={{ fontSize: '1.35rem' }}>Content unavailable</h1>
        <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate(`/events/${eventSlug}`)}>
          Back to Event
        </button>
      </div>
    );
  }

  if (itemSlug && !selectedItem) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', textAlign: 'center' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem' }}>Content unavailable</h1>
        <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate(`/events/${eventSlug}`)}>
          Back to Event
        </button>
      </div>
    );
  }

  if (selectedItem) {
    const isAwaitingConfirmation = pendingVoteItemId === selectedItem.id;
    return (
      <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        <Header logoSrc={eventLogoSrc} titleLine1="EVENT" titleLine2="INFO" />
        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{selectedItem.name}</h1>
          {selectedItem.imageUrl && (
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}
            />
          )}
          {selectedItem.description && (
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.55, margin: '0.35rem 0 1rem' }}>
              {selectedItem.description}
            </p>
          )}
          {config.voting.enabled && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.9rem', background: '#f8fafc', marginBottom: '1rem' }}>
              {config.voting.open ? (
                <>
                  <div style={{ color: '#1f2937', fontWeight: 900, marginBottom: '0.65rem' }}>
                    {votesRemaining} {votesRemaining === 1 ? 'vote' : 'votes'} remaining
                  </div>
                  {selectedItemVoteCount > 0 && (
                    <div style={{ color: '#047857', fontWeight: 900, marginBottom: '0.65rem' }}>
                      Your vote{selectedItemVoteCount > 1 ? ` x${selectedItemVoteCount}` : ''}
                    </div>
                  )}
                  {checkIn?.status !== 'completed' ? (
                    <div style={{ color: '#92400e', fontWeight: 800 }}>Complete event check-in before voting.</div>
                  ) : isAwaitingConfirmation ? (
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                      <div style={{ color: '#334155', fontWeight: 800 }}>Give {selectedItem.name} a vote?</div>
                      <button className="actionBtn actionBtn-primary" type="button" style={{ margin: 0 }} onClick={() => confirmVote(selectedItem.id)}>
                        Confirm Vote
                      </button>
                      <button className="actionBtn actionBtn-secondary" type="button" style={{ margin: 0 }} onClick={() => setPendingVoteItemId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="actionBtn actionBtn-primary"
                      type="button"
                      style={{ margin: 0 }}
                      disabled={!canVote}
                      onClick={() => setPendingVoteItemId(selectedItem.id)}
                    >
                      {votesRemaining > 0 ? `Give ${selectedItem.name} a vote` : 'No votes remaining'}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ color: '#64748b', fontWeight: 800 }}>Voting is closed.</div>
              )}
            </div>
          )}
          <Link className="actionBtn actionBtn-secondary" to={`/events/${event.slug}`}>
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="EVENT" titleLine2="INFO" />
      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{config.title}</h1>
        {ece.description && (
          <p style={{ color: '#64748b', lineHeight: 1.5, fontWeight: 700, marginTop: 0 }}>
            {ece.description}
          </p>
        )}

        <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
          {config.items.map((item, index) => (
            <div key={`${item.name}-${index}`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.9rem', background: '#fff' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}
                  />
                )}
                <div>
                  <div style={{ color: '#1f2937', fontWeight: 900, fontSize: '1.05rem' }}>
                    {item.name || `Item ${index + 1}`}
                  </div>
                  {item.description && (
                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.45, margin: '0.35rem 0 0' }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link className="actionBtn actionBtn-secondary" to={`/events/${event.slug}`}>
          Back to Event
        </Link>
      </div>
    </div>
  );
}
