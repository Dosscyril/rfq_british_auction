import React from 'react';
import { useCountdown } from '../hooks/useCountdown';

// ── Status badge ──────────────────────────────────────────────
const STATUS_STYLES = {
  ACTIVE:       { bg: '#dcfce7', color: '#166534' },
  DRAFT:        { bg: '#f1f5f9', color: '#475569' },
  CLOSED:       { bg: '#fee2e2', color: '#991b1b' },
  FORCE_CLOSED: { bg: '#fef3c7', color: '#92400e' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.03em',
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Rank badge ────────────────────────────────────────────────
const RANK_COLORS = ['#16a34a','#0284c7','#9333ea','#dc2626','#b45309'];

export function RankBadge({ rank }) {
  const color = RANK_COLORS[Math.min(rank - 1, RANK_COLORS.length - 1)];
  return (
    <span style={{
      background: `${color}22`, color, fontWeight: 700,
      padding: '2px 10px', borderRadius: 20, fontSize: 12,
    }}>
      L{rank}
    </span>
  );
}

// ── Countdown timer ───────────────────────────────────────────
export function Countdown({ targetDate, label = 'Closes in' }) {
  const { hours, minutes, seconds, expired } = useCountdown(targetDate);

  if (expired) return <span style={{ color: '#dc2626', fontWeight: 600 }}>Closed</span>;

  const pad = (n) => String(n).padStart(2, '0');
  const isUrgent = hours === 0 && minutes < 10;

  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: isUrgent ? '#dc2626' : '#0284c7', fontSize: 14 }}>
      {label}: {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}

// ── Simple card ───────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', disabled, type = 'button', style }) {
  const base = {
    padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
    opacity: disabled ? 0.6 : 1, transition: 'opacity .15s', ...style,
  };
  const variants = {
    primary:   { background: '#0f172a', color: '#fff' },
    secondary: { background: '#f1f5f9', color: '#334155' },
    danger:    { background: '#fee2e2', color: '#991b1b' },
    success:   { background: '#dcfce7', color: '#166534' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ── Form field ────────────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return (
    <input style={{
      width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
      borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
      ...style,
    }} {...props} />
  );
}

export function Select({ children, style, ...props }) {
  return (
    <select style={{
      width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
      borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box',
      ...style,
    }} {...props}>
      {children}
    </select>
  );
}

// ── Currency formatter ────────────────────────────────────────
export function Currency({ amount, currency = 'USD' }) {
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {Number(amount).toLocaleString('en-US', { style: 'currency', currency })}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
      Loading...
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────
export function Alert({ message, type = 'error' }) {
  const colors = {
    error:   { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    success: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
    info:    { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16,
    }}>
      {message}
    </div>
  );
}