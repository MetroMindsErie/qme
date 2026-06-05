import React from 'react';

// ─── DisplayField ─────────────────────────────────────────────────────────────
// Read-only label + value pair used in details views

interface DisplayFieldProps {
  label:    string;
  value:    React.ReactNode;
  icon?:    React.ReactNode;
  hint?:    string;
  layout?:  'stacked' | 'inline';
}

export function DisplayField({ label, value, icon, hint, layout = 'stacked' }: DisplayFieldProps) {
  if (layout === 'inline') {
    return (
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '12px',
        padding:        '10px 0',
        borderBottom:   '1px solid var(--qme-gray-100)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          {icon && <span style={{ color:'var(--qme-gray-400)' }} aria-hidden="true">{icon}</span>}
          <span style={{ fontSize:'14px', color:'var(--qme-gray-500)', fontWeight:500 }}>{label}</span>
          {hint && (
            <span style={{ fontSize:'12px', color:'var(--qme-gray-400)', fontStyle:'italic' }}>{hint}</span>
          )}
        </div>
        <span style={{ fontSize:'14px', color:'var(--qme-gray-800)', fontWeight:500, textAlign:'right' }}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        {icon && <span style={{ color:'var(--qme-gray-400)' }} aria-hidden="true">{icon}</span>}
        <label style={{ fontSize:'12px', color:'var(--qme-gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
          {label}
        </label>
      </div>
      <span style={{ fontSize:'15px', color:'var(--qme-gray-800)', fontWeight:500 }}>
        {value || <span style={{ color:'var(--qme-gray-400)', fontStyle:'italic' }}>—</span>}
      </span>
      {hint && <span style={{ fontSize:'12px', color:'var(--qme-gray-400)' }}>{hint}</span>}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label:    string;
  value:    string | number;
  sub?:     string;
  icon?:    React.ReactNode;
  color?:   'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  trend?:   'up' | 'down' | 'flat';
}

const COLOR_MAP = {
  primary: { bg:'var(--qme-primary-bg)',  icon:'var(--qme-primary)',  value:'var(--qme-primary-hover)' },
  success: { bg:'var(--qme-success-bg)',  icon:'var(--qme-success)',  value:'var(--qme-success)' },
  warning: { bg:'var(--qme-warning-bg)',  icon:'var(--qme-warning)',  value:'var(--qme-warning)' },
  danger:  { bg:'var(--qme-danger-bg)',   icon:'var(--qme-danger)',   value:'var(--qme-danger)' },
  neutral: { bg:'var(--qme-gray-50)',     icon:'var(--qme-gray-500)', value:'var(--qme-gray-800)' },
};

export function MetricCard({ label, value, sub, icon, color = 'neutral', trend }: MetricCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div
      role="region"
      aria-label={label}
      style={{
        background:   '#fff',
        border:       '1px solid var(--qme-gray-200)',
        borderRadius: 'var(--qme-r-lg)',
        padding:      '18px 20px',
        boxShadow:    'var(--qme-shadow-xs)',
        display:      'flex',
        flexDirection:'column',
        gap:          '8px',
        minWidth:     0,
      }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'13px', color:'var(--qme-gray-500)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>
          {label}
        </span>
        {icon && (
          <span style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '32px',
            height:         '32px',
            borderRadius:   'var(--qme-r)',
            background:     c.bg,
            color:          c.icon,
          }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:'6px' }}>
        <span style={{ fontSize:'28px', fontWeight:700, color:c.value, lineHeight:1 }}>{value}</span>
        {sub && <span style={{ fontSize:'13px', color:'var(--qme-gray-500)' }}>{sub}</span>}
      </div>
      {trend && (
        <span style={{ fontSize:'12px', color: trend === 'up' ? 'var(--qme-danger)' : trend === 'down' ? 'var(--qme-success)' : 'var(--qme-gray-400)' }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs last hour
        </span>
      )}
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label:       string;
  htmlFor?:    string;
  required?:   boolean;
  hint?:       string;
  error?:      string;
  children:    React.ReactNode;
}

export function FormField({ label, htmlFor, required, hint, error, children }: FormFieldProps) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label
        htmlFor={htmlFor}
        style={{ fontSize:'14px', fontWeight:600, color:'var(--qme-gray-700)' }}
      >
        {label}
        {required && <span style={{ color:'var(--qme-danger)', marginLeft:'3px' }} aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && (
        <span style={{ fontSize:'12px', color:'var(--qme-gray-500)' }}>{hint}</span>
      )}
      {error && (
        <span role="alert" style={{ fontSize:'12px', color:'var(--qme-danger)', fontWeight:500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── QmeInput ────────────────────────────────────────────────────────────────

interface QmeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?:  React.ReactNode;
}

export function QmeInput({ error, icon, style, className = '', ...rest }: QmeInputProps) {
  return (
    <div style={{ position:'relative' }}>
      {icon && (
        <span style={{
          position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)',
          color:'var(--qme-gray-400)', pointerEvents:'none',
        }} aria-hidden="true">
          {icon}
        </span>
      )}
      <input
        className={`qme-focus ${className}`}
        style={{
          width:         '100%',
          padding:       icon ? '9px 14px 9px 38px' : '9px 14px',
          background:    '#fff',
          border:        `1.5px solid ${error ? 'var(--qme-danger)' : 'var(--qme-gray-300)'}`,
          borderRadius:  'var(--qme-r)',
          fontSize:      '14px',
          color:         'var(--qme-gray-900)',
          outline:       'none',
          boxSizing:     'border-box',
          transition:    `border-color var(--qme-dur-fast) var(--qme-ease)`,
          fontFamily:    'var(--qme-font)',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

// ─── QmeSelect ───────────────────────────────────────────────────────────────

interface QmeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function QmeSelect({ error, style, className = '', children, ...rest }: QmeSelectProps) {
  return (
    <select
      className={`qme-focus ${className}`}
      style={{
        width:        '100%',
        padding:      '9px 14px',
        background:   '#fff',
        border:       `1.5px solid ${error ? 'var(--qme-danger)' : 'var(--qme-gray-300)'}`,
        borderRadius: 'var(--qme-r)',
        fontSize:     '14px',
        color:        'var(--qme-gray-900)',
        outline:      'none',
        cursor:       'pointer',
        fontFamily:   'var(--qme-font)',
        boxSizing:    'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

// ─── QmeTextarea ─────────────────────────────────────────────────────────────

interface QmeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function QmeTextarea({ error, style, className = '', ...rest }: QmeTextareaProps) {
  return (
    <textarea
      className={`qme-focus ${className}`}
      style={{
        width:       '100%',
        padding:     '9px 14px',
        background:  '#fff',
        border:      `1.5px solid ${error ? 'var(--qme-danger)' : 'var(--qme-gray-300)'}`,
        borderRadius:'var(--qme-r)',
        fontSize:    '14px',
        color:       'var(--qme-gray-900)',
        outline:     'none',
        resize:      'vertical',
        minHeight:   '80px',
        fontFamily:  'var(--qme-font)',
        boxSizing:   'border-box',
        lineHeight:  1.5,
        ...style,
      }}
      {...rest}
    />
  );
}

// ─── Toggle (Switch) ──────────────────────────────────────────────────────────

interface ToggleProps {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  label:     string;
  size?:     'sm' | 'md';
}

export function QmeToggle({ checked, onChange, label, size = 'md' }: ToggleProps) {
  const w = size === 'sm' ? 34 : 42;
  const h = size === 'sm' ? 20 : 24;
  const dot = size === 'sm' ? 14 : 18;
  return (
    <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', userSelect:'none' }}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="qme-focus"
        style={{
          width:        w,
          height:       h,
          borderRadius: h / 2,
          background:   checked ? 'var(--qme-primary)' : 'var(--qme-gray-300)',
          border:       'none',
          cursor:       'pointer',
          position:     'relative',
          padding:      0,
          transition:   `background var(--qme-dur) var(--qme-ease)`,
          flexShrink:   0,
          outline:      'none',
        }}
      >
        <span style={{
          position:    'absolute',
          top:         (h - dot) / 2,
          left:        checked ? w - dot - (h - dot) / 2 : (h - dot) / 2,
          width:       dot,
          height:      dot,
          borderRadius:'50%',
          background:  '#fff',
          boxShadow:   '0 1px 3px rgba(0,0,0,0.15)',
          transition:  `left var(--qme-dur) var(--qme-ease)`,
        }} />
      </button>
      <span style={{ fontSize:'14px', color:'var(--qme-gray-700)', fontWeight:500 }}>{label}</span>
    </label>
  );
}
