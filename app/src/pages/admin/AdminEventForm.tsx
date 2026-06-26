/**
 * Admin: Create or Edit an event.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import {
  canManageEvent,
  canManageOrganization,
  getCurrentAdminPrincipal,
  getManagedOrganizationIds,
  type CurrentAdminPrincipal,
} from '../../lib/adminPrincipalService';
import { createEvent, getEvent, updateEvent } from '../../lib/eventService';
import { listOrganizations } from '../../lib/organizationService';
import { slugify } from '../../lib/utils';
import type { CreateEventInput, Organization } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminEventForm() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(eventId);
  const requestedOrganizationId = searchParams.get('organizationId');

  const [form, setForm] = useState<CreateEventInput>({
    organization_id: null,
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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const admin = await getCurrentAdminPrincipal();
        setCurrentAdmin(admin);
        const managedOrganizationIds = getManagedOrganizationIds(admin);
        const orgs = admin && !admin.isSuperadmin
          ? await listOrganizations({ ids: managedOrganizationIds })
          : await listOrganizations();
        setOrganizations(orgs);

        if (eventId) {
          const ev = await getEvent(eventId);
          if (admin && !canManageEvent(admin, ev)) {
            setAccessDenied(true);
            return;
          }
          setForm({
            organization_id: ev.organization_id,
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
        } else if (admin && !admin.isSuperadmin && managedOrganizationIds.length === 0) {
          setAccessDenied(true);
        } else if (requestedOrganizationId && orgs.some((org) => org.id === requestedOrganizationId)) {
          setForm((prev) => ({ ...prev, organization_id: requestedOrganizationId }));
        } else if (orgs.length === 1) {
          setForm((prev) => ({ ...prev, organization_id: orgs[0].id }));
        }
      } catch (e) {
        console.error('Failed to load event', e);
        alert(eventId ? 'Event not found' : 'Could not load organizations');
        if (eventId) navigate('/admin/events');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigate, requestedOrganizationId]);

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
    if (currentAdmin && !canManageOrganization(currentAdmin, form.organization_id ?? null)) {
      alert('This account cannot manage events for the selected organization.');
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

  if (accessDenied) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>Event setup unavailable</h1>
          <p style={{ color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
            This admin account does not have organization admin access for this event.
          </p>
          <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate('/admin/events')}>
            Back to Events
          </button>
        </div>
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
          <label style={labelStyle}>Organization</label>
          <select
            style={inputStyle}
            value={form.organization_id || ''}
            onChange={(e) => handleChange('organization_id', e.target.value)}
          >
            <option value="">No organization assigned</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

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
