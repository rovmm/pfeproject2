import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{title}</div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', margin: '7px 0 0' }}>{message}</p>
    </div>
  );
}
