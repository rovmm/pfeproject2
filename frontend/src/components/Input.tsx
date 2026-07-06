import type { InputHTMLAttributes, ReactNode } from 'react';

export function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--error-strong)', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

export default function Input({
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`input ${error ? 'input-error' : ''} ${rest.disabled ? 'input-disabled' : ''} ${className}`}
      {...rest}
    />
  );
}

export function IconInput({
  icon,
  error,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; error?: boolean }) {
  return (
    <div className="input-row" style={error ? { border: '1.5px solid var(--error-input-border)', background: 'var(--error-input-bg)' } : undefined}>
      <span className="input-row-icon" style={error ? { color: 'var(--error)' } : undefined}>{icon}</span>
      <input {...rest} />
    </div>
  );
}
