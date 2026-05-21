/**
 * MenuModal — bottom-sheet menu overlay for event activities.
 * Used to showcase configurable menus (food, drink, etc.).
 */
import { useEffect } from 'react';
import '../styles/menuModal.css';

export interface MenuItem {
  emoji: string;
  name: string;
  note?: string;
}

export interface MenuConfig {
  id: string;
  icon: string;
  color: string;
  title: string;
  badge?: string;
  availability: string;
  items: MenuItem[];
}

interface MenuModalProps {
  config: MenuConfig | null;
  onClose: () => void;
}

export default function MenuModal({ config, onClose }: MenuModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!config) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [config, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = config ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [config]);

  if (!config) return null;

  return (
    <div className="mm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mm-handle" aria-hidden="true" />

        {/* Sheet header */}
        <div className="mm-header">
          <div className="mm-icon-wrap" style={{ background: config.color + '22' }}>
            <span style={{ fontSize: '1.3rem' }}>{config.icon}</span>
          </div>
          <div className="mm-header-text">
            <div className="mm-title">{config.title}</div>
            {config.badge && (
              <span className="mm-badge" style={{ background: config.color + '22', color: config.color }}>
                {config.badge}
              </span>
            )}
          </div>
          <button className="mm-close-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Availability */}
        <div className="mm-avail">
          <span className="mm-avail-dot" />
          {config.availability}
        </div>

        {/* Menu items */}
        <div className="mm-items">
          {config.items.map((item, i) => (
            <div key={i} className="mm-item">
              <span className="mm-item-emoji" aria-hidden="true">{item.emoji}</span>
              <div className="mm-item-body">
                <div className="mm-item-name">{item.name}</div>
                {item.note && <div className="mm-item-note">{item.note}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="mm-footer-note">
          Menu items and availability are subject to change.
        </div>

        <button className="mm-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
