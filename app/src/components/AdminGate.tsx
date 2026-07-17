import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentAdminPrincipal, signInAdmin, signOutAdmin, type CurrentAdminPrincipal } from '../lib/adminPrincipalService';
import { completeOwnAdminProfile } from '../lib/adminPrincipalAdminService';
import '../styles/shared.css';
import '../styles/admin.css';

interface AdminGateProps {
  children: ReactNode;
}

export default function AdminGate({ children }: AdminGateProps) {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminPrincipal | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentAdminPrincipal()
      .then((admin) => {
        if (!active) return;
        if (admin) setCurrentAdmin(admin);
      })
      .catch((authError) => {
        console.error('Failed to load admin principal', authError);
      })
      .finally(() => {
        if (active) setCheckingAuth(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const admin = await signInAdmin(email.trim(), password);
      if (!admin) {
        setError('Signed in, but this user is not linked to an active qME admin principal.');
        return;
      }
      setCurrentAdmin(admin);
      setPassword('');
    } catch (authError) {
      console.error('Admin sign-in failed', authError);
      setError('Admin sign-in failed.');
    }
  }

  async function handleSignOut() {
    try {
      await signOutAdmin();
    } catch (signOutError) {
      console.error('Admin sign-out failed', signOutError);
    }
    setCurrentAdmin(null);
    setEmail('');
    setPassword('');
    setError('');
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentAdmin) return;
    const firstName = profileFirstName.trim();
    const lastName = profileLastName.trim();
    if (!firstName && !lastName) {
      setError('Enter at least a first or last name.');
      return;
    }

    setProfileSaving(true);
    setError('');
    try {
      const updatedPrincipal = await completeOwnAdminProfile({
        firstName,
        lastName,
        phone: profilePhone.trim() || null,
      });
      setCurrentAdmin({
        ...currentAdmin,
        principal: updatedPrincipal,
      });
      setProfileFirstName('');
      setProfileLastName('');
      setProfilePhone('');
    } catch (profileError) {
      console.error('Failed to complete admin profile', profileError);
      setError('Could not save your profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  if (checkingAuth && !currentAdmin) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 800 }}>Checking admin access...</p>
      </div>
    );
  }

  if (currentAdmin) {
    const metadata = currentAdmin.principal.metadata ?? {};
    const needsProfile = metadata.onboarding_required === true;
    const roleLabel = currentAdmin.isSuperadmin
      ? 'qME superadmin'
      : [
          ...currentAdmin.organizationMemberships.map((membership) => membership.role.replace('_', ' ')),
          ...currentAdmin.eventStaffAssignments.map((assignment) => assignment.role.replace('_', ' ')),
          ...currentAdmin.platformRoles.map((role) => role.role),
        ].filter(Boolean).join(', ') || 'admin';

    return (
      <>
        <div className="admin-identity-bar">
          <div>
            <div className="admin-identity-label">
              {roleLabel}
            </div>
            <div className="admin-identity-name">
              {currentAdmin.principal.display_name} · {currentAdmin.principal.email ?? 'no email'}
            </div>
          </div>
          <button type="button" className="admin-identity-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        {needsProfile ? (
          <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <form
              onSubmit={handleProfileSubmit}
              style={{
                width: '100%',
                maxWidth: 420,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '1.25rem',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1.8, textTransform: 'uppercase', color: '#2f3e4f', marginBottom: '0.45rem', textAlign: 'center' }}>
                Staff Profile
              </div>
              <h1 className="headline" style={{ fontSize: '1.35rem', margin: '0 0 0.75rem', textAlign: 'center' }}>
                Complete your name
              </h1>
              <label style={{ display: 'block', color: '#2f3e4f', fontWeight: 800, marginBottom: '0.75rem' }}>
                Email
                <input
                  value={currentAdmin.principal.email ?? ''}
                  readOnly
                  type="email"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '1rem', marginTop: 6, background: '#f8fafc' }}
                />
              </label>
              <label style={{ display: 'block', color: '#2f3e4f', fontWeight: 800, marginBottom: '0.75rem' }}>
                First name
                <input
                  value={profileFirstName}
                  onChange={(event) => {
                    setProfileFirstName(event.target.value);
                    setError('');
                  }}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '1rem', marginTop: 6 }}
                />
              </label>
              <label style={{ display: 'block', color: '#2f3e4f', fontWeight: 800, marginBottom: '0.75rem' }}>
                Last name
                <input
                  value={profileLastName}
                  onChange={(event) => {
                    setProfileLastName(event.target.value);
                    setError('');
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '1rem', marginTop: 6 }}
                />
              </label>
              <label style={{ display: 'block', color: '#2f3e4f', fontWeight: 800, marginBottom: '0.75rem' }}>
                Mobile phone <span style={{ color: '#64748b' }}>(optional)</span>
                <input
                  value={profilePhone}
                  onChange={(event) => setProfilePhone(event.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="2165719060 or +964..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '1rem', marginTop: 6 }}
                />
              </label>
              {error && (
                <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {error}
                </div>
              )}
              <button className="actionBtn actionBtn-primary" style={{ margin: 0 }} type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Continue'}
              </button>
            </form>
          </div>
        ) : children}
      </>
    );
  }

  return (
    <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleAuthSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '1.25rem',
          background: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: 1.8, textTransform: 'uppercase', color: '#2f3e4f', marginBottom: '0.45rem' }}>
          Admin Access
        </div>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: '0 0 0.75rem' }}>
          Sign in
        </h1>
        <input
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError('');
          }}
          autoFocus
          type="email"
          autoComplete="email"
          aria-label="Admin email"
          placeholder="Email"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.85rem',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: '1rem',
            marginBottom: '0.75rem',
          }}
        />
        <input
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError('');
          }}
          type="password"
          autoComplete="current-password"
          aria-label="Admin password"
          placeholder="Password"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.85rem',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: '1rem',
            marginBottom: '0.75rem',
          }}
        />
        {error && (
          <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            {error}
          </div>
        )}
        <button className="actionBtn actionBtn-primary" style={{ margin: 0 }} type="submit">
          Sign In
        </button>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ marginTop: '0.75rem' }}
          type="button"
          onClick={() => navigate('/')}
        >
          Back to Event
        </button>
      </form>
    </div>
  );
}
