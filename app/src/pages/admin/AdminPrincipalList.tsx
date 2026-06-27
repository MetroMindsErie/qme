import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import {
  createAdminPrincipal,
  createAdminUserWithAuth,
  listAdminPrincipals,
  updateAdminPrincipal,
} from '../../lib/adminPrincipalAdminService';
import { getCurrentAdminPrincipal, type CurrentAdminPrincipal } from '../../lib/adminPrincipalService';
import type { AdminPrincipal, CreateAdminPrincipalInput } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#2f3e4f',
  fontSize: '0.82rem',
  fontWeight: 800,
  flex: '1 1 180px',
};

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.75rem',
  border: '1.5px solid #d1d5db',
  borderRadius: 8,
  fontSize: '0.95rem',
  background: '#fff',
};

const emptyForm: CreateAdminPrincipalInput = {
  principal_type: 'person',
  display_name: '',
  email: '',
  phone: '',
  auth_user_id: '',
  status: 'active',
};

export default function AdminPrincipalList() {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [principals, setPrincipals] = useState<AdminPrincipal[]>([]);
  const [form, setForm] = useState<CreateAdminPrincipalInput>(emptyForm);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const admin = await getCurrentAdminPrincipal();
      setCurrentAdmin(admin);
      if (!admin?.isSuperadmin) {
        setAccessDenied(true);
        return;
      }
      setPrincipals(await listAdminPrincipals());
    } catch (error) {
      console.error('Failed to load admin principals', error);
      alert('Could not load admin principals.');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateForm<K extends keyof CreateAdminPrincipalInput>(field: K, value: CreateAdminPrincipalInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.display_name.trim()) {
      alert('Display name is required.');
      return;
    }
    setSaving(true);
    try {
      if (password.trim()) {
        await createAdminUserWithAuth({
          displayName: form.display_name,
          email: form.email || '',
          password,
          phone: form.phone,
          principalType: form.principal_type,
        });
      } else {
        await createAdminPrincipal(form);
      }
      setForm(emptyForm);
      setPassword('');
      setPrincipals(await listAdminPrincipals());
    } catch (error) {
      console.error('Failed to save admin principal', error);
      alert('Could not save admin user. Check whether the email already exists or the service-role key is configured.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkAuthUser(principal: AdminPrincipal) {
    const nextAuthId = prompt(
      `Paste the Supabase Auth user UUID to link to ${principal.display_name}.`,
      principal.auth_user_id || ''
    );
    if (nextAuthId === null) return;
    try {
      await updateAdminPrincipal(principal.id, { auth_user_id: nextAuthId });
      setPrincipals(await listAdminPrincipals());
    } catch (error) {
      console.error('Failed to link auth user', error);
      alert('Could not link Auth user. Check that the UUID is valid and not already linked to another principal.');
    }
  }

  async function handleStatusChange(principal: AdminPrincipal, status: AdminPrincipal['status']) {
    if (principal.id === currentAdmin?.principal.id && status !== 'active') {
      alert('You cannot deactivate your own active admin principal from here.');
      return;
    }
    try {
      await updateAdminPrincipal(principal.id, { status });
      setPrincipals(await listAdminPrincipals());
    } catch (error) {
      console.error('Failed to update admin principal status', error);
      alert('Could not update status.');
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 className="headline" style={{ fontSize: '1.4rem', margin: '0 0 0.75rem' }}>Superadmin only</h1>
          <p style={{ color: '#64748b', fontWeight: 700, lineHeight: 1.5 }}>
            Admin principal linking is restricted to qME superadmin accounts.
          </p>
          <button className="actionBtn actionBtn-secondary" type="button" onClick={() => navigate('/admin/events')}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc="/images/qmeFirstLogo.jpg" titleLine1="ADMIN" titleLine2="IDENTITY" />

      <div style={{ padding: '0 1.25rem 1rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.45rem', margin: '0 0 0.35rem', fontWeight: 800 }}>
          Admin Principals
        </h1>
        <p style={{ color: '#64748b', margin: 0, lineHeight: 1.45, fontWeight: 700 }}>
          Create named qME admin/staff users. Enter a password to create the Supabase login now, or leave it blank to create a principal-only record for later linking.
        </p>
      </div>

      <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            padding: '1rem',
            marginBottom: '1rem',
            background: '#fafafa',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.7rem',
            alignItems: 'end',
          }}
        >
          <label style={fieldStyle}>
            Display Name
            <input
              style={inputStyle}
              value={form.display_name}
              onChange={(event) => updateForm('display_name', event.target.value)}
              placeholder="Alex Staff"
            />
          </label>
          <label style={fieldStyle}>
            Email
            <input
              style={inputStyle}
              value={form.email || ''}
              onChange={(event) => updateForm('email', event.target.value)}
              type="email"
              placeholder="staff@example.com"
            />
          </label>
          <label style={{ ...fieldStyle, flex: '1 1 260px' }}>
            Auth User UUID
            <input
              style={inputStyle}
              value={form.auth_user_id || ''}
              onChange={(event) => updateForm('auth_user_id', event.target.value)}
              placeholder="Paste Supabase Auth user id"
            />
          </label>
          <label style={{ ...fieldStyle, flex: '1 1 210px' }}>
            New Login Password
            <input
              style={inputStyle}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Optional: create login"
              autoComplete="new-password"
            />
          </label>
          <label style={fieldStyle}>
            Type
            <select
              style={inputStyle}
              value={form.principal_type}
              onChange={(event) => updateForm('principal_type', event.target.value as AdminPrincipal['principal_type'])}
            >
              <option value="person">Person</option>
              <option value="station">Station</option>
              <option value="service_provider">Service provider</option>
              <option value="support">Support</option>
            </select>
          </label>
          <button
            className="actionBtn actionBtn-primary"
            type="submit"
            disabled={saving || !form.display_name.trim() || Boolean(password.trim() && !form.email?.trim())}
            style={{ margin: 0, width: 'auto', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            {saving ? 'Saving...' : password.trim() ? 'Create User' : 'Add Principal'}
          </button>
        </form>

        {principals.map((principal) => (
          <div
            key={principal.id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 10,
              padding: '1rem',
              marginBottom: '0.75rem',
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 230 }}>
              <div style={{ fontWeight: 800, color: '#2f3e4f', fontSize: '1.05rem' }}>
                {principal.display_name}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: 4, lineHeight: 1.45 }}>
                {principal.email || 'No email'} · {principal.principal_type.replace('_', ' ')} · {principal.status}
              </div>
              <div style={{ color: principal.auth_user_id ? '#16a34a' : '#b45309', fontSize: '0.78rem', fontWeight: 900, marginTop: 6 }}>
                {principal.auth_user_id ? `Linked Auth user: ${principal.auth_user_id}` : 'No Auth user linked'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                className="actionBtn actionBtn-secondary"
                type="button"
                style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                onClick={() => handleLinkAuthUser(principal)}
              >
                Link Auth
              </button>
              {principal.status === 'active' ? (
                <button
                  className="actionBtn actionBtn-danger"
                  type="button"
                  style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  onClick={() => handleStatusChange(principal, 'archived')}
                >
                  Archive
                </button>
              ) : (
                <button
                  className="actionBtn actionBtn-primary"
                  type="button"
                  style={{ margin: 0, width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  onClick={() => handleStatusChange(principal, 'active')}
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
