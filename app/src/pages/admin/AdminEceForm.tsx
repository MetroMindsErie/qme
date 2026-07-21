import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createEce, getEce, updateEce } from '../../lib/eceService';
import { getEvent } from '../../lib/eventService';
import { listExpiesForOrganization } from '../../lib/expieService';
import { createQueue, listQueuesForEvent } from '../../lib/queueService';
import { isSotcEventSlug } from '../../lib/sotc';
import { slugify } from '../../lib/utils';
import type { CreateEceInput, Expie, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEceForm() {
  const navigate = useNavigate();
  const { eventId, eceId } = useParams<{ eventId: string; eceId: string }>();
  const isEdit = Boolean(eceId);

  const [event, setEvent] = useState<QEvent | null>(null);
  const [expies, setExpies] = useState<Expie[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [form, setForm] = useState<Omit<CreateEceInput, 'event_id'>>({
    expie_id: null,
    org_id: null,
    name: '',
    slug: '',
    description: '',
    image_url: '',
    type: 'info',
    queue_id: null,
    queue_behavior: '',
    location: '',
    sort_order: 100,
    starts_at: null,
    ends_at: null,
    status: 'active',
    metadata: {},
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const [ev, qs] = await Promise.all([
          getEvent(eventId),
          listQueuesForEvent(eventId),
        ]);
        setEvent(ev);
        setQueues(qs);
        setForm((prev) => ({ ...prev, org_id: ev.organization_id }));

        if (ev.organization_id) {
          setExpies(await listExpiesForOrganization(ev.organization_id));
        }

        if (eceId) {
          const ece = await getEce(eceId);
          setForm({
            expie_id: ece.expie_id,
            org_id: ece.org_id,
            name: ece.name,
            slug: ece.slug,
            description: ece.description,
            image_url: ece.image_url,
            type: ece.type,
            queue_id: ece.queue_id,
            queue_behavior: ece.queue_behavior,
            location: ece.location,
            sort_order: ece.sort_order,
            starts_at: ece.starts_at,
            ends_at: ece.ends_at,
            status: ece.status,
            metadata: ece.metadata || {},
          });
          setAutoSlug(false);
        }
      } catch (error) {
        console.error('Failed to load eCe form', error);
        alert('Could not load eCe form.');
        navigate(eventId ? `/admin/events/${eventId}` : '/admin/events');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, eceId, navigate]);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const nullableFields = new Set<keyof typeof form>([
        'expie_id',
        'org_id',
        'queue_id',
        'starts_at',
        'ends_at',
      ]);
      const next = {
        ...prev,
        [field]:
          field === 'sort_order'
            ? Number(value) || 100
            : nullableFields.has(field)
            ? value || null
            : value,
      };
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      if (field === 'expie_id') {
        const selectedExpie = expies.find((expie) => expie.id === value);
        if (selectedExpie) {
          next.name = selectedExpie.name;
          next.slug = selectedExpie.slug;
          next.description = selectedExpie.description;
          next.image_url = selectedExpie.image_url;
          next.type = selectedExpie.type;
          next.queue_behavior = selectedExpie.default_queue_behavior;
          next.metadata = selectedExpie.default_metadata;
          setAutoSlug(false);
        }
      }
      if (field === 'type' && value !== 'queue') {
        next.queue_id = null;
        next.queue_behavior = '';
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !form.expie_id || !form.name.trim() || !form.slug?.trim()) {
      alert('Choose an expie, and confirm name and slug are filled in.');
      return;
    }

    setSaving(true);
    try {
      let queueId = form.queue_id;

      if (form.type === 'queue' && !queueId) {
        const existingQueue = queues.find((queue) => queue.slug === form.slug);

        if (existingQueue) {
          queueId = existingQueue.id;
        } else {
          const queue = await createQueue({
            event_id: eventId,
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description || '',
            image_url: form.image_url || '',
            status: 'active',
          });
          queueId = queue.id;
        }
      }

      const payload = {
        ...form,
        queue_id: form.type === 'queue' ? queueId : null,
      };

      if (isEdit && eceId) {
        await updateEce(eceId, payload);
      } else {
        await createEce({
          ...payload,
          event_id: eventId,
        });
      }
      navigate(`/admin/events/${eventId}`);
    } catch (error) {
      console.error('Save failed', error);
      alert('Save failed. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '0.8rem',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: 5,
    color: '#2f3e4f',
  };
  const inputStyle: React.CSSProperties = {
    padding: '0.55rem 0.65rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  };
  const eventLogoSrc = isSotcEventSlug(event?.slug)
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="ADMIN" titleLine2="eCe" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
          {isEdit ? 'Edit Event eCe' : 'Add Event eCe'}
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {event?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Reusable Expie *</label>
          <select
            style={inputStyle}
            value={form.expie_id || ''}
            onChange={(e) => handleChange('expie_id', e.target.value)}
            required
          >
            <option value="">Choose an expie</option>
            {expies.map((expie) => (
              <option key={expie.id} value={expie.id}>
                {expie.name} ({expie.type.replace('_', '-')})
              </option>
            ))}
          </select>
          {expies.length === 0 && (
            <span style={{ color: '#B71C1C', fontSize: '0.82rem', marginTop: 6 }}>
              This organization needs a reusable expie before you can add an eCe.
            </span>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>eCe Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Registration Check-In"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle}
            value={form.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="registration-check-in"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Type</label>
            <select
              style={inputStyle}
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="info">Info</option>
              <option value="check_in">Check-In</option>
              <option value="queue">Queue</option>
              <option value="resource">Resource</option>
              <option value="session">Session</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Sort</label>
            <input
              style={inputStyle}
              type="number"
              value={form.sort_order ?? 100}
              onChange={(e) => handleChange('sort_order', e.target.value)}
            />
          </div>
        </div>

        {form.type === 'queue' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Queue Behavior</label>
              <select
                style={inputStyle}
                value={form.queue_behavior || ''}
                onChange={(e) => handleChange('queue_behavior', e.target.value)}
              >
                <option value="">Choose later</option>
                <option value="numbered">Numbered queue</option>
                <option value="check_in_service">Check-in/service queue</option>
                <option value="standby_gather">Standby/gather queue</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Linked Queue Engine</label>
              <select
                style={inputStyle}
                value={form.queue_id || ''}
                onChange={(e) => handleChange('queue_id', e.target.value)}
              >
                <option value="">No queue linked yet</option>
                {queues.map((queue) => (
                  <option key={queue.id} value={queue.id}>
                    {queue.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What should guests know?"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Location at Event</label>
          <input
            style={inputStyle}
            value={form.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Level 1 registration table"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Image URL</label>
          <input
            style={inputStyle}
            value={form.image_url || ''}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="/images/example.jpg"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create eCe'}
          </button>
          <button
            type="button"
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            onClick={() => navigate(`/admin/events/${eventId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
