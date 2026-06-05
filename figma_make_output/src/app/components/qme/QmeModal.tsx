import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { QmeButton } from './QmeButton';

interface QmeModalProps {
  open:       boolean;
  onClose:    () => void;
  title:      string;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
  size?:      'sm' | 'md' | 'lg';
  ariaDesc?:  string;
}

export function QmeModal({ open, onClose, title, children, footer, size = 'md', ariaDesc }: QmeModalProps) {
  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: '400px', md: '520px', lg: '680px' }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qme-modal-title"
      aria-describedby={ariaDesc ? 'qme-modal-desc' : undefined}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         1000,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '16px',
        background:     'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="qme-fade-up"
        style={{
          background:   '#fff',
          borderRadius: 'var(--qme-r-xl)',
          boxShadow:    'var(--qme-shadow-xl)',
          width:        '100%',
          maxWidth:     maxW,
          maxHeight:    'calc(100vh - 40px)',
          display:      'flex',
          flexDirection:'column',
        }}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '20px 24px 16px',
          borderBottom:   '1px solid var(--qme-gray-200)',
        }}>
          <h2
            id="qme-modal-title"
            style={{ margin:0, fontSize:'18px', fontWeight:600, color:'var(--qme-gray-900)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="qme-focus"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              padding:      '4px',
              borderRadius: 'var(--qme-r-sm)',
              color:        'var(--qme-gray-500)',
              transition:   `color var(--qme-dur-fast) var(--qme-ease)`,
              lineHeight:   1,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          id={ariaDesc ? 'qme-modal-desc' : undefined}
          style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:     '16px 24px 20px',
            borderTop:   '1px solid var(--qme-gray-200)',
            display:     'flex',
            justifyContent: 'flex-end',
            gap:         '8px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open:         boolean;
  onClose:      () => void;
  onConfirm:    () => void;
  title:        string;
  message:      string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:       boolean;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false,
}: ConfirmModalProps) {
  return (
    <QmeModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      ariaDesc="confirm-desc"
      footer={
        <>
          <QmeButton variant="ghost" size="md" onClick={onClose}>{cancelLabel}</QmeButton>
          <QmeButton
            variant={danger ? 'danger' : 'primary'}
            size="md"
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </QmeButton>
        </>
      }
    >
      <p id="confirm-desc" style={{ margin:0, color:'var(--qme-gray-600)', lineHeight:1.6 }}>
        {message}
      </p>
    </QmeModal>
  );
}
