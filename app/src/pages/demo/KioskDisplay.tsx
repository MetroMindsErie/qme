/**
 * KioskDisplay — tablet kiosk shown at the venue.
 * Route: /kiosk/:eventSlug/:queueSlug
 *
 * Displays NOW SERVING, a tap-to-join button, and a QR code
 * so guests can join the queue from their phone.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useQueueMetric } from '../../hooks/useQueueMetric';
import { getEventBySlug } from '../../lib/eventService';
import { getQueueBySlug, peekTicketForQueue } from '../../lib/queueService';
import type { QEvent, Queue } from '../../types';
import './KioskDisplay.css';

export default function KioskDisplay() {
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { nowServing } = useQueueMetric(queue?.id);

  // Derive guest-facing URL for the QR code
  const guestUrl = `${window.location.origin}/events/${eventSlug}/q/${queueSlug}`;

  const load = useCallback(async () => {
    if (!eventSlug || !queueSlug) return;
    try {
      const ev = await getEventBySlug(eventSlug);
      setEvent(ev);
      const q = await getQueueBySlug(ev.id, queueSlug);
      setQueue(q);
      const last = await peekTicketForQueue(q.id);
      setNextNumber(last + 1);
    } catch (e) {
      console.error('Kiosk load failed', e);
    } finally {
      setLoading(false);
    }
  }, [eventSlug, queueSlug]);

  // Refresh next number every 10s so it stays current
  useEffect(() => {
    load();
    const interval = setInterval(async () => {
      if (!queue?.id) return;
      try {
        const last = await peekTicketForQueue(queue.id);
        setNextNumber(last + 1);
      } catch { /* */ }
    }, 10_000);
    return () => clearInterval(interval);
  }, [load, queue?.id]);

  function handleTapToJoin() {
    navigate(`/events/${eventSlug}/q/${queueSlug}/ticket`);
  }

  if (loading) {
    return (
      <div className="kiosk-root">
        <div className="kiosk-loading">Loading…</div>
      </div>
    );
  }

  const displayName = queue?.name ?? 'Queue';
  const subName = event?.name ?? '';
  const waitMins = nowServing ? Math.max(1, (nextNumber ?? nowServing + 1) - nowServing) * 5 : null;

  return (
    <div className="kiosk-root">
      {/* Header */}
      <div className="kiosk-header">
        <div className="kiosk-header-left">
          {event?.image_url ? (
            <img src={event.image_url} alt={displayName} className="kiosk-logo" />
          ) : (
            <div className="kiosk-logo-placeholder">qMe</div>
          )}
          <div className="kiosk-header-text">
            <div className="kiosk-title">{displayName}</div>
            <div className="kiosk-subtitle">{subName}</div>
            {event?.location && (
              <div className="kiosk-location">📍 {event.location}</div>
            )}
          </div>
        </div>
        <div className="kiosk-active-badge">● ACTIVE</div>
      </div>

      {/* NOW SERVING */}
      <div className="kiosk-serving-section">
        <div className="kiosk-serving-label">NOW SERVING</div>
        <div className="kiosk-serving-number">{nowServing}</div>
        {waitMins != null && (
          <div className="kiosk-wait">⏱ ~{Math.min(waitMins, 60)} min wait</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="kiosk-actions">
        <button className="kiosk-btn kiosk-btn-tap" onClick={handleTapToJoin}>
          <div className="kiosk-btn-icon">👆</div>
          <div className="kiosk-btn-title">TAP TO TAKE<br />A NUMBER</div>
          {nextNumber != null && (
            <div className="kiosk-btn-number">{nextNumber}</div>
          )}
        </button>

        <div className="kiosk-btn kiosk-btn-scan">
          <div className="kiosk-btn-icon">📷</div>
          <div className="kiosk-btn-title">SCAN TO JOIN<br />ON YOUR PHONE</div>
          <div className="kiosk-qr-wrap">
            <QRCodeSVG
              value={guestUrl}
              size={140}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
              level="M"
            />
          </div>
          <div className="kiosk-qr-hint">
            Open your camera and<br />scan the code above.
          </div>
        </div>
      </div>

      {/* Digital benefits */}
      <div className="kiosk-benefits-section">
        <div className="kiosk-benefits-title">JOIN DIGITALLY TO:</div>
        <div className="kiosk-benefits">
          <div className="kiosk-benefit">
            <span className="kiosk-benefit-num">#1</span>
            <span>See your place in line</span>
          </div>
          <div className="kiosk-benefit">
            <span className="kiosk-benefit-icon">🔔</span>
            <span>Get notified when it's your turn</span>
          </div>
          <div className="kiosk-benefit">
            <span className="kiosk-benefit-icon">📋</span>
            <span>See what's happening at the event</span>
          </div>
        </div>
      </div>

      <div className="kiosk-footer">
        Already in line? Check your status on your phone.
      </div>
    </div>
  );
}
