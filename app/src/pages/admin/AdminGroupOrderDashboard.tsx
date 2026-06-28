import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { getEvent } from '../../lib/eventService';
import { listEventCheckIns } from '../../lib/checkInService';
import {
  listGroupOrderItemsForEvent,
  onGroupOrderItemsChange,
  updateGroupOrderItemQuantity,
} from '../../lib/groupOrderService';
import type { EventCheckIn, EventGroupOrderItem, QEvent } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminGroupOrderDashboard() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<QEvent | null>(null);
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>([]);
  const [items, setItems] = useState<EventGroupOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!eventId) return;
    try {
      const ev = await getEvent(eventId);
      const [orderRows, checkInRows] = await Promise.all([
        listGroupOrderItemsForEvent(ev.id),
        listEventCheckIns(ev.id),
      ]);
      setEvent(ev);
      setItems(orderRows);
      setCheckIns(checkInRows);
      setError('');
    } catch (err) {
      console.error('Failed to load group order', err);
      setError('Could not load group order items. Confirm the group order SQL has been run.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!event?.id) return;
    return onGroupOrderItemsChange(event.id, refresh);
  }, [event?.id, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  const checkInById = useMemo(() => {
    return new Map(checkIns.map((row) => [row.id, row]));
  }, [checkIns]);

  const grouped = useMemo(() => {
    const map = new Map<string, EventGroupOrderItem[]>();
    for (const item of items) {
      const list = map.get(item.check_in_id) ?? [];
      list.push(item);
      map.set(item.check_in_id, list);
    }
    return Array.from(map.entries());
  }, [items]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item.quantity <= 0) continue;
      const key = item.item_name.trim().toLowerCase();
      map.set(key, (map.get(key) ?? 0) + item.quantity);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  async function setQuantity(item: EventGroupOrderItem, quantity: number) {
    try {
      await updateGroupOrderItemQuantity(item.id, Math.max(0, quantity));
      await refresh();
    } catch (err) {
      console.error('Failed to update item quantity', err);
      alert('Could not update quantity.');
    }
  }

  if (loading) {
    return <div className="card"><p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p></div>;
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc={event?.image_url || '/images/qmeFirstLogo.jpg'}
        titleLine1="ADMIN"
        titleLine2="GROUP ORDER"
      />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
          Dinner Order List
        </h1>
        <p style={{ color: '#64748b', margin: '0.35rem 0 0', fontWeight: 700 }}>
          {event?.name || 'Event'} · {items.filter((item) => item.quantity > 0).length} active items
        </p>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ margin: '0.8rem 0 0', width: 'auto', padding: '0.45rem 0.9rem' }}
          onClick={() => navigate(`/admin/events/${event?.id ?? eventId}`)}
        >
          Back to Event
        </button>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: 8, padding: '0.75rem', marginBottom: '0.9rem', color: '#B71C1C', fontWeight: 800 }}>
            {error}
          </div>
        )}

        <section style={{ marginBottom: '1.2rem' }}>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem', color: '#1e293b' }}>Kitchen Totals</h2>
          {totals.length === 0 ? (
            <p style={{ color: '#94a3b8', fontWeight: 700 }}>No active items yet.</p>
          ) : totals.map(([name, quantity]) => (
            <div key={name} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ color: '#1e293b', fontWeight: 850, textTransform: 'capitalize' }}>{name}</span>
              <span style={{ color: '#5B4FCE', fontWeight: 900 }}>x{quantity}</span>
            </div>
          ))}
        </section>

        <section>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem', color: '#1e293b' }}>By Guest</h2>
          {grouped.length === 0 ? (
            <p style={{ color: '#94a3b8', fontWeight: 700 }}>No guest submissions yet.</p>
          ) : grouped.map(([checkInId, guestItems]) => {
            const guest = checkInById.get(checkInId);
            return (
              <div key={checkInId} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.85rem', marginBottom: '0.8rem', background: '#fff' }}>
                <div style={{ fontWeight: 900, color: '#1e293b', marginBottom: '0.55rem' }}>
                  {guest ? `${guest.first_name} ${guest.last_name}`.trim() : 'Unknown guest'}
                </div>
                {guestItems.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'center', padding: '0.45rem 0', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ color: item.quantity === 0 ? '#94a3b8' : '#334155', fontWeight: 800, textDecoration: item.quantity === 0 ? 'line-through' : 'none' }}>
                      {item.item_name}
                    </span>
                    <input
                      className="textInput"
                      type="number"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item, Number(e.target.value) || 0)}
                      style={{ width: 72, padding: '0.45rem 0.5rem' }}
                      aria-label={`Quantity for ${item.item_name}`}
                    />
                    <button
                      className="actionBtn actionBtn-secondary"
                      style={{ margin: 0, width: 'auto', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                      onClick={() => setQuantity(item, 0)}
                      disabled={item.quantity === 0}
                    >
                      Zero
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
