/**
 * Guest: Queue landing page (scoped to a specific queue within an event).
 * Shows NOW SERVING, queue info, and Join / Re-Join / Leave actions.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import DisplayField from '../../components/DisplayField';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { getStoredQueueTicket, clearQueueTicket } from '../../hooks/useQueueTicket';
import { getEventBySlug } from '../../lib/eventService';
import { getQueueBySlug, leaveQueue } from '../../lib/queueService';
import { formatDate, formatTime } from '../../lib/utils';
import type { QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

export default function GuestQueueLanding() {
  const navigate = useNavigate();
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);

  const { nowServing } = useQueueMetric(queue?.id);

  const [note1, setNote1] = useState('');
  const [buttonText, setButtonText] = useState('Join Queue');
  const [showLeave, setShowLeave] = useState(false);

  // Load event + queue
  useEffect(() => {
    if (!eventSlug || !queueSlug) return;
    (async () => {
      try {
        const ev = await getEventBySlug(eventSlug);
        setEvent(ev);
        const q = await getQueueBySlug(ev.id, queueSlug);
        setQueue(q);
      } catch (e) {
        console.error('Failed to load queue', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventSlug, queueSlug]);

  // Handle ?cleared=1
  useEffect(() => {
    if (searchParams.get('cleared') === '1' && queue) {
      clearQueueTicket(queue.id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queue]);

  // Update UI based on stored ticket
  const updateUI = useCallback(() => {
    if (!queue) return;
    const t = getStoredQueueTicket(queue.id);
    if (t) {
      setButtonText('Re-Join Queue');
      setShowLeave(true);
      setNote1(`You have ticket #${t} in this queue`);
    } else {
      setButtonText('Join Queue');
      setShowLeave(false);
      setNote1('');
    }
  }, [queue]);

  useEffect(() => {
    updateUI();
  }, [updateUI]);

  // Cross-tab sync
  useEffect(() => {
    const handler = () => updateUI();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [updateUI]);

  // Handlers
  function handleJoin() {
    if (!queue || !eventSlug || !queueSlug) return;
    const t = getStoredQueueTicket(queue.id);
    if (t) {
      navigate(`/events/${eventSlug}/q/${queueSlug}/ticket?resume=1`);
    } else {
      navigate(`/events/${eventSlug}/q/${queueSlug}/ticket`);
    }
  }

  async function handleLeave() {
    if (!queue) return;
    const id = Number(getStoredQueueTicket(queue.id) || 0);
    if (id) {
      try { await leaveQueue(id, 'user'); } catch (e) {
        console.warn('leave POST failed (non-fatal)', e);
      }
    }
    clearQueueTicket(queue.id);
    updateUI();
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  if (!event || !queue) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Queue not found.</p>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={queue.image_url || event.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1=""
        titleLine2=""
      />

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

      <h1 className="headline" contentEditable suppressContentEditableWarning aria-label="Edit headline" style={{ margin: '0.5rem 0 0.75rem' }}>
        NOW SERVING
      </h1>

      <div className="metric1" role="group" aria-label="Primary metric">
        <input
          id="metric1"
          className="metricInput1"
          type="number"
          min={1}
          step={1}
          value={nowServing || ''}
          readOnly
          inputMode="numeric"
          aria-label="Metric value"
        />
      </div>

      <div className="inputs">
        <DisplayField id="dsp1" label="Queue" value={queue.name} className="displayInput3" />
        <DisplayField id="dsp4" label="Event" value={event.name} className="displayInput2" />
      </div>

      <div className="rule" aria-hidden="true" />

      {/* Queue description */}
      {queue.description && (
        <div className="miniGroup">
          {queue.image_url && (
            <div className="mini">
              <img id="miniImg" src={queue.image_url} alt="Badge" className="miniImg" />
            </div>
          )}
          <div className="miniText">
            <span className="miniLine">{queue.description}</span>
          </div>
        </div>
      )}

      <div className="inputs">
        <DisplayField id="dsp2" label="Event Date" value={formatDate(event.event_date)} className="displayInput3" />
        <DisplayField id="dsp5" label="Start Time" value={formatTime(event.start_time)} />
        <DisplayField id="dsp3" label="Time Zone" value={event.timezone} />
        <DisplayField id="dsp6" label="End Time" value={formatTime(event.end_time)} />
      </div>

      <div className="actionGroup" style={{ marginTop: 'auto' }}>
        <div className="actionNote">{note1}</div>
        <button className="actionBtn" onClick={handleJoin}>
          {buttonText}
        </button>
        {showLeave && (
          <button className="actionBtn" id="leaveBtn" onClick={handleLeave} aria-label="Leave queue">
            Leave Queue
          </button>
        )}
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ margin: 0, width: 'auto', padding: '0.5rem 1.5rem' }}
          onClick={() => navigate(`/events/${eventSlug}`)}
        >
          ← Back to Event
        </button>
      </div>
      </div>
    </div>
  );
}
