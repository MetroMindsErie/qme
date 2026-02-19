/**
 * Admin: Create or Edit a queue within an event.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createQueue, getQueue, updateQueue } from '../../lib/queueService';
import { slugify } from '../../lib/utils';
import type { CreateQueueInput } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminQueueForm() {
  const navigate = useNavigate();
  const { eventId, queueId } = useParams<{ eventId: string; queueId: string }>();
  const isEdit = Boolean(queueId);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    status: 'active' as 'active' | 'paused' | 'closed',
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!queueId) return;
    (async () => {
      try {
        const q = await getQueue(queueId);
        setForm({
          name: q.name,
          slug: q.slug,
          description: q.description,
          image_url: q.image_url,
          status: q.status,
        });
        setAutoSlug(false);
      } catch (e) {
        console.error('Failed to load queue', e);
        alert('Queue not found');
        navigate(`/admin/events/${eventId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [queueId, eventId, navigate]);

  function handleChange(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      alert('Name and slug are required.');
      return;
    }
    if (!eventId) return;
    setSaving(true);
    try {
      if (isEdit && queueId) {
        await updateQueue(queueId, {
          name: form.name,
          slug: form.slug,
          description: form.description,
          image_url: form.image_url,
          status: form.status,
        });
      } else {
        const input: CreateQueueInput = {
          event_id: eventId,
          name: form.name,
          slug: form.slug,
          description: form.description,
          image_url: form.image_url,
          status: form.status,
        };
        await createQueue(input);
      }
      navigate(`/admin/events/${eventId}`);
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed. Check console.');
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
    marginBottom: '0.75rem',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: 4,
    color: '#555',
  };
  const inputStyle: React.CSSProperties = {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: '1rem',
  };

  return (
    <div className="card" style={{ maxWidth: 550 }}>
      <Header
        logoSrc="/images/qmeFirstLogo.jpg"
        titleLine1="ADMIN"
        titleLine2={isEdit ? 'EDIT Q' : 'NEW Q'}
      />

      <h1 className="headline" style={{ fontSize: '1.3rem' }}>
        {isEdit ? 'Edit Queue' : 'Add Queue'}
      </h1>

      <form onSubmit={handleSubmit} style={{ padding: '0 1.5rem 1.5rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Queue Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Taco Truck"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle}
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="taco-truck"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Authentic street tacos and burritos"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Image URL</label>
          <input
            style={inputStyle}
            value={form.image_url}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="/images/taco-truck.jpg"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Status</label>
          <select
            style={inputStyle}
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="submit"
            className="actionBtn"
            style={{ margin: 0, flex: 1 }}
            disabled={saving}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Queue'}
          </button>
          <button
            type="button"
            className="actionBtn"
            style={{ margin: 0, flex: 1, background: '#888' }}
            onClick={() => navigate(`/admin/events/${eventId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
