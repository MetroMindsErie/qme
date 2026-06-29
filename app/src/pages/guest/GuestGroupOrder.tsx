import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEventCheckIn } from '../../lib/checkInService';
import { getEventCheckInConfig } from '../../lib/eventConfig';
import { getEventBySlug } from '../../lib/eventService';
import {
  createGroupOrderItem,
  listGroupOrderItemsForCheckIn,
  onGroupOrderItemsChange,
} from '../../lib/groupOrderService';
import type { EventCheckIn, EventGroupOrderItem, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/guest.css';

function storageKey(eventId: string) {
  return `qme:eventCheckIn:${eventId}`;
}

function readStoredCheckIn(eventId: string): { id?: string; firstName?: string; lastName?: string } | null {
  try {
    const stored = localStorage.getItem(storageKey(eventId));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function GuestGroupOrder() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [checkIn, setCheckIn] = useState<EventCheckIn | null>(null);
  const [items, setItems] = useState<EventGroupOrderItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeItems = useMemo(() => items.filter((item) => item.quantity > 0), [items]);
  const removedItems = useMemo(() => items.filter((item) => item.quantity === 0), [items]);
  const checkInConfig = getEventCheckInConfig(event);
  const canOrder = Boolean(checkIn && (!checkInConfig.requireCompletedForParticipation || checkIn.status === 'completed'));

  useEffect(() => {
    if (!eventSlug) return;
    let stopped = false;

    async function load() {
      try {
        const ev = await getEventBySlug(eventSlug!);
        if (stopped) return;
        setEvent(ev);
        const stored = readStoredCheckIn(ev.id);
        if (stored) {
          if (stored.id) {
            try {
              const row = await getEventCheckIn(stored.id);
              if (!stopped) {
                setCheckIn(row);
                setItems(await listGroupOrderItemsForCheckIn(row.id));
              }
            } catch {
              // Let the guest re-check-in if the local row is stale.
            }
          }
        }
      } catch (err) {
        console.error('Failed to load group order', err);
        setError('Could not load the dinner order page.');
      } finally {
        if (!stopped) setLoading(false);
      }
    }

    load();
    return () => {
      stopped = true;
    };
  }, [eventSlug]);

  useEffect(() => {
    if (!event?.id || !checkIn?.id) return;
    return onGroupOrderItemsChange(event.id, async () => {
      try {
        setItems(await listGroupOrderItemsForCheckIn(checkIn.id));
      } catch {
        // Polling fallback below handles temporary realtime misses.
      }
    });
  }, [event?.id, checkIn?.id]);

  useEffect(() => {
    if (!checkIn?.id) return;
    const interval = setInterval(async () => {
      try {
        setItems(await listGroupOrderItemsForCheckIn(checkIn.id));
      } catch {
        // Keep current list visible.
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [checkIn?.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event || !checkIn || !canOrder || !itemName.trim() || quantity < 1) return;
    setSaving(true);
    setError('');
    try {
      await createGroupOrderItem({
        event_id: event.id,
        check_in_id: checkIn.id,
        item_name: itemName,
        quantity,
      });
      setItemName('');
      setQuantity(1);
      setItems(await listGroupOrderItemsForCheckIn(checkIn.id));
    } catch (err) {
      console.error('Failed to save order item', err);
      setError('Could not save that item. Confirm the group order SQL has been run.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card"><p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p></div>;
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={event?.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1="GROUP"
        titleLine2="ORDER"
      />

      <div style={{ padding: '0 1.25rem 0.9rem', borderBottom: '1px solid #e5e7eb' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: 0, fontWeight: 800 }}>
          Dinner Order
        </h1>
        <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontWeight: 700, lineHeight: 1.4 }}>
          Add tapas or drinks for the shared list. You can add more any time.
        </p>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 800 }}>
            {error}
          </div>
        )}

        <div style={{ border: '2px solid #10b981', borderRadius: 12, padding: '0.9rem', marginBottom: '1rem', background: '#ecfdf5' }}>
          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
            Status
          </div>
          <div style={{ color: '#064e3b', fontSize: '1.35rem', fontWeight: 900, marginTop: 4 }}>
            On the group list
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: '0.8rem', alignItems: 'center' }}>
            {['Add Items', 'Shared List', 'Order Together'].map((step, index) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  margin: '0 auto 0.25rem',
                  background: index < 2 ? '#10b981' : '#fff',
                  color: index < 2 ? '#fff' : '#64748b',
                  border: `2px solid ${index < 2 ? '#10b981' : '#cbd5e1'}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                }}>
                  {index + 1}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#334155', fontWeight: 800 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
          {!canOrder && (
            <div style={{ border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem', background: '#fffbeb', color: '#92400e', fontWeight: 800, lineHeight: 1.45 }}>
              {!checkIn ? (
                <>
                  Please check in to the event before adding dinner items.
                  <Link
                    to={`/events/${eventSlug}/check-in`}
                    className="actionBtn actionBtn-primary"
                    style={{ textDecoration: 'none', margin: '0.75rem 0 0' }}
                  >
                    Check In First
                  </Link>
                </>
              ) : (
                <>
                  You are checked in, but staff still needs to approve your check-in before you can add dinner items.
                </>
              )}
            </div>
          )}
          {checkIn && (
            <div style={{ color: '#334155', fontWeight: 800 }}>
              Checked in as {checkIn.first_name} {checkIn.last_name}
            </div>
          )}
          <input
            className="textInput"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item, e.g. patatas bravas"
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.6rem' }}>
            <input
              className="textInput"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              aria-label="Quantity"
              disabled={!canOrder}
            />
            <button className="actionBtn actionBtn-primary" style={{ margin: 0 }} disabled={saving || !canOrder}>
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>

        <h2 style={{ fontSize: '1rem', color: '#1e293b', margin: '1rem 0 0.5rem' }}>
          Your Items
        </h2>
        {activeItems.length === 0 ? (
          <p style={{ color: '#94a3b8', fontWeight: 700 }}>No items yet.</p>
        ) : activeItems.map((item) => (
          <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', marginBottom: '0.55rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span style={{ fontWeight: 850, color: '#1e293b' }}>{item.item_name}</span>
            <span style={{ fontWeight: 900, color: '#5B4FCE' }}>x{item.quantity}</span>
          </div>
        ))}
        {removedItems.length > 0 && (
          <div style={{ marginTop: '0.75rem', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>
            Removed by admin: {removedItems.map((item) => item.item_name).join(', ')}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb' }}>
        <Link to={`/events/${eventSlug}`} className="actionBtn actionBtn-secondary" style={{ textDecoration: 'none', margin: 0 }}>
          Back to Event
        </Link>
      </div>
    </div>
  );
}
