import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

interface MenuProps {
  children?: React.ReactNode;
}

export default function Menu({ children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* Hamburger button */}
      <button
        className={`hamburger ${open ? 'is-open' : ''}`}
        aria-label="Open menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Backdrop */}
      {open && (
        <div className="menuBackdrop" onClick={close} />
      )}

      {/* Panel */}
      <aside
        ref={panelRef}
        className={`menuPanel ${open ? 'open' : ''}`}
        hidden={!open}
      >
        <nav className="menuNav" onClick={close}>
          {children ?? (
            <>
              <Link to="/">Home</Link>
              <Link to="/admin">Admin Dashboard</Link>
              <Link to="/ticket">Guest Ticket</Link>
              <Link to="/events">Events</Link>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
