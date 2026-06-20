import { FormEvent, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/shared.css';

const ADMIN_ACCESS_KEY = 'qme:adminAccess';
const DEFAULT_ADMIN_PASSCODE = 'qme-admin';

interface AdminGateProps {
  children: ReactNode;
}

export default function AdminGate({ children }: AdminGateProps) {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(ADMIN_ACCESS_KEY) === '1');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const expectedPasscode = (import.meta.env.VITE_ADMIN_PASSCODE as string | undefined)?.trim()
    || DEFAULT_ADMIN_PASSCODE;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passcode.trim() !== expectedPasscode) {
      setError('Passphrase did not match.');
      return;
    }
    sessionStorage.setItem(ADMIN_ACCESS_KEY, '1');
    setUnlocked(true);
    setPasscode('');
    setError('');
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="card" style={{ minHeight: '600px', padding: '2rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
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
          Enter passphrase
        </h1>
        <input
          value={passcode}
          onChange={(event) => {
            setPasscode(event.target.value);
            setError('');
          }}
          autoFocus
          type="password"
          aria-label="Admin passphrase"
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
          Unlock
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
