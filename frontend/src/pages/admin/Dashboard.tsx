import { useEffect, useMemo, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../api/session.api';
import { useToast } from '../../components/Toast';
import type { AdminStatsResponse, Role, UserResponse } from '../../types';

const badgeClass: Record<Role, string> = {
  STUDENT: 'badge-student',
  PROF: 'badge-professor',
  ADMIN: 'badge-admin',
};

const AVATAR_PALETTE = [
  { bg: 'var(--tint-indigo-strong)', color: 'var(--blue-accent)' },
  { bg: 'var(--tint-indigo)', color: 'var(--navy-light)' },
  { bg: 'var(--tint-green)', color: 'var(--success)' },
  { bg: 'var(--tint-pink)', color: '#c14a7a' },
  { bg: 'var(--tint-amber)', color: 'var(--amber-strong)' },
];

function avatarFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function fmtJoined(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AdminDashboard({ showStats = true }: { showStats?: boolean }) {
  useBreadcrumb([showStats ? 'Dashboard' : 'Users']);
  const pushToast = useToast();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'PROF'>('ALL');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);

  useEffect(() => {
    adminApi.getUsers().then(setUsers).catch(() => pushToast('error', 'Could not load users'));
    if (showStats) {
      adminApi.getStats().then(setStats).catch(() => pushToast('error', 'Could not load stats'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStats]);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchesQuery = `${u.fullName} ${u.email}`.toLowerCase().includes(query.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesQuery && matchesRole;
      }),
    [users, query, roleFilter],
  );

  function deleteUser(id: number) {
    adminApi
      .deleteUser(id)
      .then(() => {
        setUsers((u) => u.filter((x) => x.id !== id));
        pushToast('success', 'User removed');
      })
      .catch(() => pushToast('error', 'Could not remove user'));
  }

  return (
    <div style={{ padding: '26px 34px' }}>
      {showStats && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 26 }}>
          <StatCard icon={<Icon name="user-single" size={19} />} iconBg="var(--tint-indigo-strong)" value={stats.totalUsers.toLocaleString()} label="Total Users" />
          <StatCard icon={<Icon name="menu" size={19} />} iconBg="var(--tint-indigo)" value={stats.totalSessions.toLocaleString()} label="Sessions" />
          <StatCard icon={<Icon name="code" size={19} />} iconBg="var(--tint-green)" value={stats.totalExecutions.toLocaleString()} label="Code Executions" />
          <StatCard icon={<Icon name="file-text" size={19} />} iconBg="var(--tint-amber)" value={stats.totalPdfSummaries.toLocaleString()} label="PDF Summaries" />
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--surface-muted)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: 0 }}>Users</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--page-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', width: 240 }}>
            <span style={{ color: 'var(--ink-placeholder)' }}>
              <Icon name="search" size={13} />
            </span>
            <input
              placeholder="Search name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13, width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--page-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            {(['ALL', 'STUDENT', 'PROF'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className="btn btn-sm"
                style={{ border: 'none', background: roleFilter === r ? 'var(--surface)' : 'transparent', color: roleFilter === r ? 'var(--navy)' : 'var(--ink-muted)', padding: '6px 12px' }}
              >
                {r === 'ALL' ? 'All' : r === 'STUDENT' ? 'Student' : 'Prof'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 0.6fr', gap: 12, padding: '11px 20px', background: 'var(--surface-alt)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--ink-placeholder)' }}>
          <span>NAME</span>
          <span>EMAIL</span>
          <span>ROLE</span>
          <span>JOINED</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)', fontSize: 13.5 }}>No users match your search.</div>
        ) : (
          filtered.map((u) => {
            const avatar = avatarFor(u.fullName);
            return (
              <div
                key={u.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 0.6fr', gap: 12, padding: '14px 20px', alignItems: 'center', borderTop: '1px solid var(--surface-muted)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: avatar.bg, color: avatar.color }}>
                    {initialsOf(u.fullName)}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{u.fullName}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{u.email}</span>
                <span>
                  <span className={`badge ${badgeClass[u.role]}`}>{u.role}</span>
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{fmtJoined(u.createdAt)}</span>
                <span style={{ color: '#d99', cursor: 'pointer', textAlign: 'center' }} onClick={() => deleteUser(u.id)}>
                  <Icon name="trash" size={16} />
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
