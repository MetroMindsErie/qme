import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle, Bell, Loader2 } from 'lucide-react';
import type { TicketStatus } from '../../data/mockData';

// ─── StatusBadge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const STATUS_CONFIG: Record<TicketStatus, {
  label: string; icon: React.ReactNode;
  bg: string; border: string; text: string; dot: string;
}> = {
  waiting: {
    label: 'In Queue',
    icon: <Clock size={12} />,
    bg: 'var(--qme-info-bg)',
    border: 'var(--qme-info-border)',
    text: 'var(--qme-info)',
    dot: 'var(--qme-info)',
  },
  ready: {
    label: 'Ready',
    icon: <Bell size={12} />,
    bg: 'var(--qme-success-bg)',
    border: 'var(--qme-success-border)',
    text: 'var(--qme-success)',
    dot: 'var(--qme-success)',
  },
  checked_in: {
    label: 'Checked In',
    icon: <CheckCircle2 size={12} />,
    bg: 'var(--qme-primary-bg)',
    border: 'var(--qme-primary-border)',
    text: 'var(--qme-primary-hover)',
    dot: 'var(--qme-primary)',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle size={12} />,
    bg: 'var(--qme-gray-100)',
    border: 'var(--qme-gray-300)',
    text: 'var(--qme-gray-500)',
    dot: 'var(--qme-gray-400)',
  },
  no_show: {
    label: 'No Show',
    icon: <AlertTriangle size={12} />,
    bg: 'var(--qme-warning-bg)',
    border: 'var(--qme-warning-border)',
    text: 'var(--qme-warning)',
    dot: 'var(--qme-warning)',
  },
};

export function StatusBadge({ status, size = 'md', pulse = false }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const isReady = status === 'ready';

  const paddings: Record<string, string> = {
    sm: '2px 8px',
    md: '4px 10px',
    lg: '6px 14px',
  };
  const fontSizes: Record<string, string> = {
    sm: '11px',
    md: '12px',
    lg: '13px',
  };

  return (
    <span
      role="status"
      aria-label={`Status: ${cfg.label}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '5px',
        padding:       paddings[size],
        background:    cfg.bg,
        border:        `1px solid ${cfg.border}`,
        borderRadius:  'var(--qme-r-full)',
        color:         cfg.text,
        fontSize:      fontSizes[size],
        fontWeight:    600,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
      }}
    >
      {/* Dot */}
      <span
        style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   cfg.dot,
          flexShrink:   0,
        }}
        className={isReady && pulse ? 'qme-pulse-dot' : ''}
      />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── SLABadge ────────────────────────────────────────────────────────────────

interface SLABadgeProps { breached: boolean; waitMinutes: number; threshold: number; }

export function SLABadge({ breached, waitMinutes, threshold }: SLABadgeProps) {
  if (!breached) return null;
  return (
    <span
      role="alert"
      aria-label={`SLA breached: ${waitMinutes} min wait exceeds ${threshold} min threshold`}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '4px',
        padding:      '2px 8px',
        background:   'var(--qme-warning-bg)',
        border:       '1px solid var(--qme-warning-border)',
        borderRadius: 'var(--qme-r-full)',
        color:        'var(--qme-warning)',
        fontSize:     '11px',
        fontWeight:   600,
      }}
    >
      <AlertTriangle size={10} />
      +{waitMinutes - threshold}m overdue
    </span>
  );
}

// ─── QueueStatusBadge ────────────────────────────────────────────────────────

interface QueueStatusBadgeProps { status: 'active' | 'paused' | 'closed'; }

export function QueueStatusBadge({ status }: QueueStatusBadgeProps) {
  const cfg = {
    active: { label: 'Active', bg: 'var(--qme-success-bg)', border: 'var(--qme-success-border)', text: 'var(--qme-success)' },
    paused: { label: 'Paused', bg: 'var(--qme-warning-bg)', border: 'var(--qme-warning-border)', text: 'var(--qme-warning)' },
    closed: { label: 'Closed', bg: 'var(--qme-gray-100)',   border: 'var(--qme-gray-300)',        text: 'var(--qme-gray-500)' },
  }[status];

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '5px',
      padding:      '3px 10px',
      background:   cfg.bg,
      border:       `1px solid ${cfg.border}`,
      borderRadius: 'var(--qme-r-full)',
      color:        cfg.text,
      fontSize:     '12px',
      fontWeight:   600,
    }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:cfg.text }} />
      {cfg.label}
    </span>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  onRemove?: () => void;
  color?: 'primary' | 'neutral';
}

export function Chip({ label, onRemove, color = 'neutral' }: ChipProps) {
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 10px',
      background:   color === 'primary' ? 'var(--qme-primary-bg)' : 'var(--qme-gray-100)',
      border:       `1px solid ${color === 'primary' ? 'var(--qme-primary-border)' : 'var(--qme-gray-200)'}`,
      borderRadius: 'var(--qme-r-full)',
      color:        color === 'primary' ? 'var(--qme-primary-hover)' : 'var(--qme-gray-700)',
      fontSize:     '12px',
      fontWeight:   500,
    }}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="qme-focus"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
            color: 'inherit', opacity: 0.6, lineHeight: 1,
          }}
        >×</button>
      )}
    </span>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      className="qme-spin"
      aria-hidden="true"
      style={{ color: 'currentColor' }}
    />
  );
}
