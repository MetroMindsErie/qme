import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentAdminPrincipal, signInAdmin } from '../lib/adminPrincipalService';
import '../styles/shared.css';

const ADMIN_ACCESS_KEY = 'qme:adminAccess';
const DEFAULT_ADMIN_PASSCODE = 'qme-admin';

interface AdminGateProps {
  children: ReactNode;
}

export default function AdminGate({ children }: AdminGateProps) {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(ADMIN_ACCESS_KEY) === '1');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const expectedPasscode = (import.meta.env.VITE_ADMIN_PASSCODE as string | undefined)?.trim()
    || DEFAULT_ADMIN_PASSCODE;

  useEffect(() => {
    let active = true;
    getCurrentAdminPrincipal()
      .then((admin) => {
        if (!active) return;
        if (admin) {
          setAdminName(admin.principal.display_name);
          sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
          setUnlocked(true);
        }
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
      setAdminName(admin.principal.display_name);
      sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
      setUnlocked(true);
      setPassword('');
    } catch (authError) {
      console.error('Admin sign-in failed', authError);
      setError('Admin sign-in failed.');
    }
  }

  function handlePassphraseSubmit() {
    if (passcode.trim() !== expectedPasscode) {
      setError('Passphrase did not match.');
      return;
    }
    sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
    setUnlocked(true);
    setPasscode('');
    setError('');
  }

  if (checkingAuth && !unlocked) {
    return (
      <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontWeight: 800 }}>Checking admin access...</p>
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

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
        <div style={{ margin: '1rem 0', borderTop: '1px solid #e5e7eb' }} />
        <div style={{ textAlign: 'left', color: '#64748b', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Temporary pilot fallback
        </div>
        <input
          value={passcode}
          onChange={(event) => {
            setPasscode(event.target.value);
            setError('');
          }}
          type="password"
          aria-label="Temporary admin passphrase"
          placeholder="Passphrase"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: '0.95rem',
            marginBottom: '0.75rem',
          }}
        />
        <button
          className="actionBtn actionBtn-secondary"
          style={{ margin: 0 }}
          type="button"
          onClick={handlePassphraseSubmit}
        >
          Unlock with Passphrase
        </button>
        <button
          className="actionBtn actionBtn-secondary"
          style={{ marginTop: '0.75rem' }}
          type="button"
          onClick={() => navigate('/')}
        >
          Back to Event
        </button>
        {adminName && (
          <div style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.78rem' }}>
            Signed in as {adminName}
          </div>
        )}
      </form>
    </div>
  );
}
