import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createExpie, getExpie, updateExpie, type CreateExpieInput } from '../../lib/expieService';
import { getOrganization } from '../../lib/organizationService';
import { slugify } from '../../lib/utils';
import type { Expie, Organization } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

export default function AdminExpieForm() {
  const navigate = useNavigate();
  const { organizationId, expieId } = useParams<{ organizationId: string; expieId: string }>();
  const isEdit = Boolean(expieId);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [form, setForm] = useState<CreateExpieInput>({
    organization_id: organizationId || '',
    name: '',
    slug: '',
    description: '',
    image_url: '',
    type: 'info',
    default_queue_behavior: '',
    status: 'active',
    default_metadata: {},
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      try {
        const org = await getOrganization(organizationId);
        setOrganization(org);
        setForm((prev) => ({ ...prev, organization_id: org.id }));

        if (expieId) {
          const expie: Expie = await getExpie(expieId);
          setForm({
            organization_id: expie.organization_id || org.id,
            name: expie.name,
            slug: expie.slug,
            description: expie.description,
            image_url: expie.image_url,
            type: expie.type,
            default_queue_behavior: expie.default_queue_behavior,
            status: expie.status,
            default_metadata: expie.default_metadata || {},
          });
          setAutoSlug(false);
        }
      } catch (error) {
        console.error('Failed to load expie form', error);
        alert('Could not load expie form.');
        navigate('/admin/organizations');
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationId, expieId, navigate]);

  function handleChange(field: keyof CreateExpieInput, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      if (field === 'type' && value !== 'queue') {
        next.default_queue_behavior = '';
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId || !form.name.trim() || !form.slug.trim()) {
      alert('Name and slug are required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && expieId) {
        await updateExpie(expieId, form);
      } else {
        await createExpie(form);
      }
      navigate(`/admin/organizations/${organizationId}`);
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
      <Header logoSrc={organization?.logo_url || '/images/qmeFirstLogo.jpg'} titleLine1="ADMIN" titleLine2="EXPIE" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
          {isEdit ? 'Edit Expie' : 'Create Expie'}
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {organization?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Expie Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Professional Headshots"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle}
            value={form.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="professional-headshots"
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
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {form.type === 'queue' && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Default Queue Behavior</label>
            <select
              style={inputStyle}
              value={form.default_queue_behavior || ''}
              onChange={(e) => handleChange('default_queue_behavior', e.target.value)}
            >
              <option value="">Choose later</option>
              <option value="numbered">Numbered queue</option>
              <option value="check_in_service">Check-in/service queue</option>
              <option value="standby_gather">Standby/gather queue</option>
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Reusable description for this experience."
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Default Image URL</label>
          <input
            style={inputStyle}
            value={form.image_url}
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
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Expie'}
          </button>
          <button
            type="button"
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            onClick={() => navigate(`/admin/organizations/${organizationId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
