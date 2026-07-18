import { useState } from 'react';
import Icon from './Icon';

export const LANGUAGES = ['Python 3.11', 'Java 17', 'C++ 20', 'JavaScript (Node 20)', 'TypeScript (Node 20)', 'PHP 8.3'];

export default function LanguageSelector({
  value,
  onChange,
  dark = false,
}: {
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className={dark ? 'editor-lang-pill' : ''}
        onClick={() => setOpen((o) => !o)}
        style={
          dark
            ? undefined
            : {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--page-bg)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                padding: '7px 12px',
                fontSize: 13,
                color: 'var(--ink-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
              }
        }
      >
        <Icon name="code" size={14} /> {value} <Icon name="chevron-down" size={9} style={{ color: dark ? 'var(--editor-muted)' : 'var(--ink-placeholder)' }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            zIndex: 20,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-card)',
            minWidth: 180,
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map((lang) => (
            <div
              key={lang}
              onClick={() => {
                onChange(lang);
                setOpen(false);
              }}
              style={{
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: lang === value ? 'var(--navy)' : 'var(--ink-secondary)',
                background: lang === value ? 'var(--tint-indigo)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {lang}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
