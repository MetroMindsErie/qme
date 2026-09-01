import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { getCurrentAdminPrincipal, getManagedOrganizationIds, type CurrentAdminPrincipal } from '../../lib/adminPrincipalService';
import { createOrganization, listOrganizations } from '../../lib/organizationService';
import { slugify } from '../../lib/utils';
import type { CreateOrganizationInput, Organization } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

const emptyForm: CreateOrganizationInput = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  status: 'active',
};

type OrganizationStatus = CreateOrganizationInput['status'];

export default function AdminOrganizationList() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateOrganizationInput>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const admin = await getCurrentAdminPrincipal();
      setCurrentAdmin(admin);
      const managedOrganizationIds = getManagedOrganizationIds(admin);
      setOrganizations(admin && !admin.isSuperadmin
        ? await listOrganizations({ ids: managedOrganizationIds })
        : await listOrganizations());
    } catch (error) {
      console.error('Failed to load organizations', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleFormChange(field: keyof CreateOrganizationInput, value: string) {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: field === 'status' ? value as OrganizationStatus : value,
      };
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  async function handleCreateOrganization(event: React.FormEvent) {
    event.preventDefault();
    if (!currentAdmin?.isSuperadmin) {
      alert('Only a superadmin can create organizations.');
      return;
    }
    if (!form.name.trim() || !form.slug.trim()) {
      alert('Name and slug are required.');
      return;
    }

    setSaving(true);
    try {
      const created = await createOrganization({
        ...form,
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description.trim(),
        logo_url: '',
      });
      setOrganizations((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm(emptyForm);
      setAutoSlug(true);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create organization', error);
      alert('Could not create organization. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '0.85rem',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 800,
    marginBottom: 6,
    color: '#2f3e4f',
  };
  const inputStyle: React.CSSProperties = {
    padding: '0.6rem 0.75rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
  const canCreateOrganizations = Boolean(currentAdmin?.isSuperadmin);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/qmeFirstLogo.jpg" titleLine1="ADMIN" titleLine2="ORGS" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 className="headline" style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>
            Organizations
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canCreateOrganizations && (
              <button
                className="actionBtn actionBtn-primary"
                type="button"
                style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                onClick={() => setShowCreateForm((value) => !value)}
              >
                + New Organization
              </button>
            )}
            <button
              className="actionBtn actionBtn-secondary"
              type="button"
              style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              onClick={() => navigate('/admin/events')}
            >
              Back to Events
            </button>
          </div>
        </div>
        {currentAdmin && !currentAdmin.isSuperadmin && (
          <p style={{ color: '#64748b', margin: '0.45rem 0 0', fontSize: '0.85rem', fontWeight: 700 }}>
            Showing organizations where you have organization admin access.
          </p>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading...</p>}

      {showCreateForm && canCreateOrganizations && (
        <form
          onSubmit={handleCreateOrganization}
          style={{
            borderBottom: '2px solid #e0e0e0',
            padding: '1rem 1.25rem',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div style={fieldStyle}>
              <label htmlFor="organization-name" style={labelStyle}>Name *</label>
              <input
                id="organization-name"
                style={inputStyle}
                value={form.name}
                onChange={(event) => handleFormChange('name', event.target.value)}
                placeholder="Organization name"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="organization-slug" style={labelStyle}>Slug *</label>
              <input
                id="organization-slug"
                style={inputStyle}
                value={form.slug}
                onChange={(event) => handleFormChange('slug', event.target.value)}
                placeholder="organization-slug"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label htmlFor="organization-status" style={labelStyle}>Status</label>
              <select
                id="organization-status"
                style={inputStyle}
                value={form.status}
                onChange={(event) => handleFormChange('status', event.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label htmlFor="organization-description" style={labelStyle}>Description</label>
            <textarea
              id="organization-description"
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
              placeholder="Short description"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Create Organization'}
            </button>
            <button
              type="button"
              className="actionBtn actionBtn-secondary"
              style={{ margin: 0, width: 'auto', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              onClick={() => {
                setShowCreateForm(false);
                setForm(emptyForm);
                setAutoSlug(true);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && organizations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1rem', color: '#777', marginBottom: '1rem' }}>
            No organizations yet. Run the organization foundation SQL first.
          </p>
          {currentAdmin && !currentAdmin.isSuperadmin && (
            <p style={{ fontSize: '0.9rem', color: '#777', margin: 0 }}>
              No organization admin memberships are assigned to this account yet.
            </p>
          )}
        </div>
      )}

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '0.8rem',
              background: '#fafafa',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <Link
                to={`/admin/organizations/${org.id}`}
                style={{ fontWeight: 800, color: '#2f3e4f', textDecoration: 'none', fontSize: '1.1rem' }}
              >
                {org.name}
              </Link>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4 }}>
                /{org.slug} · {org.status}
              </div>
              {org.description && (
                <div style={{ color: '#555', fontSize: '0.9rem', marginTop: 6 }}>
                  {org.description}
                </div>
              )}
            </div>
            <button
              className="actionBtn actionBtn-primary"
              style={{ margin: 0, width: 'auto', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              onClick={() => navigate(`/admin/organizations/${org.id}`)}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
