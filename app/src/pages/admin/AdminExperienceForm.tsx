import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createExperience, getExperience, updateExperience } from '../../lib/experienceService';
import { getEvent } from '../../lib/eventService';
import { listQueuesForEvent } from '../../lib/queueService';
import { slugify } from '../../lib/utils';
import type { CreateExperienceInput, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminExperienceForm() {
  const navigate = useNavigate();
  const { eventId, experienceId } = useParams<{ eventId: string; experienceId: string }>();
  const isEdit = Boolean(experienceId);

  const [event, setEvent] = useState<QEvent | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [form, setForm] = useState<Omit<CreateExperienceInput, 'event_id'>>({
    org_id: null,
    name: '',
    slug: '',
    description: '',
    image_url: '',
    type: 'info',
    queue_id: null,
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

        if (experienceId) {
          const exp = await getExperience(experienceId);
          setForm({
            org_id: exp.org_id,
            name: exp.name,
            slug: exp.slug,
            description: exp.description,
            image_url: exp.image_url,
            type: exp.type,
            queue_id: exp.queue_id,
            location: exp.location,
            sort_order: exp.sort_order,
            starts_at: exp.starts_at,
            ends_at: exp.ends_at,
            status: exp.status,
            metadata: exp.metadata || {},
          });
          setAutoSlug(false);
        }
      } catch (error) {
        console.error('Failed to load experience form', error);
        alert('Could not load experience form.');
        navigate(eventId ? `/admin/events/${eventId}` : '/admin/events');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, experienceId, navigate]);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const nullableFields = new Set<keyof typeof form>([
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
      if (field === 'type' && value !== 'queue') {
        next.queue_id = null;
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !form.name.trim() || !form.slug?.trim()) {
      alert('Name and slug are required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && experienceId) {
        await updateExperience(experienceId, form);
      } else {
        await createExperience({
          ...form,
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

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={event?.image_url || '/images/qmeFirstLogo.jpg'} titleLine1="ADMIN" titleLine2="EXPIE" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
          {isEdit ? 'Edit Experience' : 'Add Experience'}
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>{event?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Experience Name *</label>
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
          <div style={fieldStyle}>
            <label style={labelStyle}>Linked Queue</label>
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
          <label style={labelStyle}>Location</label>
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
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Experience'}
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
