/**
 * Admin: Create or Edit an event.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createEvent, getEvent, updateEvent } from '../../lib/eventService';
import { slugify } from '../../lib/utils';
import type { CreateEventInput } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventForm() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = Boolean(eventId);

  const [form, setForm] = useState<CreateEventInput>({
    name: '',
    slug: '',
    description: '',
    location: '',
    image_url: '',
    event_date: null,
    start_time: null,
    end_time: null,
    timezone: 'EST',
    status: 'draft',
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load existing event for editing
  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const ev = await getEvent(eventId);
        setForm({
          name: ev.name,
          slug: ev.slug,
          description: ev.description,
          location: ev.location,
          image_url: ev.image_url,
          event_date: ev.event_date,
          start_time: ev.start_time,
          end_time: ev.end_time,
          timezone: ev.timezone,
          status: ev.status,
        });
        setAutoSlug(false);
      } catch (e) {
        console.error('Failed to load event', e);
        alert('Event not found');
        navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate]);

  function handleChange(field: keyof CreateEventInput, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value || null };
      // Auto-generate slug from name
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug?.trim()) {
      alert('Name and slug are required.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && eventId) {
        await updateEvent(eventId, form);
      } else {
        await createEvent(form);
      }
      navigate('/admin/events');
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading…</p>
      </div>
    );
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1rem',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 700,
    marginBottom: 6,
    color: '#2f3e4f',
  };
  const inputStyle: React.CSSProperties = {
    padding: '0.65rem 0.75rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
    transition: 'all 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header
        logoSrc="/images/qmeFirstLogo.jpg"
        titleLine1="ADMIN"
        titleLine2={isEdit ? 'EDIT' : 'NEW'}
      />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>
          {isEdit ? 'Edit Event' : 'Create Event'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Event Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Food Truck Festival 2026"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle}
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="food-truck-festival-2026"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="A celebration of local food trucks…"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Location</label>
          <input
            style={inputStyle}
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Cedar Hill Park, Dallas TX"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Image URL</label>
          <input
            style={inputStyle}
            value={form.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="/images/event-banner.jpg"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Event Date</label>
            <input
              style={inputStyle}
              type="date"
              value={form.event_date || ''}
              onChange={(e) => handleChange('event_date', e.target.value)}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Timezone</label>
            <select
              style={inputStyle}
              value={form.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
            >
              <option value="EST">EST</option>
              <option value="CST">CST</option>
              <option value="MST">MST</option>
              <option value="PST">PST</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Start Time</label>
            <input
              style={inputStyle}
              type="time"
              value={form.start_time || ''}
              onChange={(e) => handleChange('start_time', e.target.value)}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>End Time</label>
            <input
              style={inputStyle}
              type="time"
              value={form.end_time || ''}
              onChange={(e) => handleChange('end_time', e.target.value)}
            />
          </div>
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

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0', flexWrap: 'wrap' as const }}>
          <button
            type="submit"
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '✨ Create Event'}
          </button>
          <button
            type="button"
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            onClick={() => navigate('/admin/events')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
