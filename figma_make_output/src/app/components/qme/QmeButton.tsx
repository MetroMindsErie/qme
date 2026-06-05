import React from 'react';
import { LoadingSpinner } from './QmeBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'admin';
export type BtnSize    = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  BtnVariant;
  size?:     BtnSize;
  loading?:  boolean;
  icon?:     React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<BtnVariant, React.CSSProperties> = {
  primary: {
    background:   'var(--qme-primary)',
    color:        '#ffffff',
    border:       '1.5px solid var(--qme-primary)',
  },
  secondary: {
    background:   'transparent',
    color:        'var(--qme-primary-hover)',
    border:       '1.5px solid var(--qme-primary)',
  },
  ghost: {
    background:   'transparent',
    color:        'var(--qme-gray-700)',
    border:       '1.5px solid transparent',
  },
  danger: {
    background:   'var(--qme-danger)',
    color:        '#ffffff',
    border:       '1.5px solid var(--qme-danger)',
  },
  admin: {
    background:   'var(--qme-admin)',
    color:        '#ffffff',
    border:       '1.5px solid var(--qme-admin)',
  },
};

const HOVER_CLASSES: Record<BtnVariant, string> = {
  primary:   'hover:opacity-90 active:scale-[0.98]',
  secondary: 'hover:bg-[var(--qme-primary-bg)] active:scale-[0.98]',
  ghost:     'hover:bg-[var(--qme-gray-100)] active:scale-[0.98]',
  danger:    'hover:opacity-90 active:scale-[0.98]',
  admin:     'hover:opacity-90 active:scale-[0.98]',
};

const SIZE_STYLES: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: '6px 14px',  fontSize: '13px', gap: '5px',  borderRadius: 'var(--qme-r-sm)' },
  md: { padding: '9px 18px',  fontSize: '14px', gap: '6px',  borderRadius: 'var(--qme-r)' },
  lg: { padding: '12px 24px', fontSize: '15px', gap: '7px',  borderRadius: 'var(--qme-r-md)' },
  xl: { padding: '15px 32px', fontSize: '16px', gap: '8px',  borderRadius: 'var(--qme-r-lg)' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function QmeButton({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`qme-focus ${HOVER_CLASSES[variant]} ${className}`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'var(--qme-font)',
        fontWeight:     600,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        opacity:        isDisabled && !loading ? 0.45 : 1,
        transition:     `background var(--qme-dur-fast) var(--qme-ease),
                         opacity    var(--qme-dur-fast) var(--qme-ease),
                         transform  var(--qme-dur-fast) var(--qme-ease)`,
        width:          fullWidth ? '100%' : undefined,
        whiteSpace:     'nowrap',
        outline:        'none',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      aria-busy={loading}
      {...rest}
    >
      {loading
        ? <LoadingSpinner size={size === 'sm' ? 13 : 15} />
        : icon && <span aria-hidden="true">{icon}</span>
      }
      {children}
      {!loading && iconRight && <span aria-hidden="true">{iconRight}</span>}
    </button>
  );
}

// ─── Icon-only button ────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: BtnVariant;
  size?: BtnSize;
}

export function QmeIconButton({ icon, label, variant = 'ghost', size = 'md', className = '', ...rest }: IconButtonProps) {
  const sz = { sm: 28, md: 34, lg: 40 }[size] ?? 34;
  return (
    <button
      aria-label={label}
      className={`qme-focus ${HOVER_CLASSES[variant]} ${className}`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          sz,
        height:         sz,
        borderRadius:   'var(--qme-r)',
        cursor:         'pointer',
        transition:     `background var(--qme-dur-fast) var(--qme-ease)`,
        outline:        'none',
        ...VARIANT_STYLES[variant],
      }}
      {...rest}
    >
      {icon}
    </button>
  );
}
