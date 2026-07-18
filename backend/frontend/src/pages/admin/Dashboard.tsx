import { useMemo, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import StatCard from '../../components/StatCard';
import { adminStats, adminUsers, type AdminUser } from '../../lib/mockData';
import { useToast } from '../../components/Toast';

const badgeClass: Record<AdminUser['role'], string> = {
  STUDENT: 'badge-student',
  PROFESSOR: 'badge-professor',
  ADMIN: 'badge-admin',
};

export default function AdminDashboard({ showStats = true }: { showStats?: boolean }) {
  useBreadcrumb([showStats ? 'Dashboard' : 'Users']);
  const pushToast = useToast();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'PROFESSOR'>('ALL');
  const [users, setUsers] = useState(adminUsers);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchesQuery = `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesQuery && matchesRole;
      }),
    [users, query, roleFilter],
  );

  function deleteUser(email: string) {
    setUsers((u) => u.filter((x) => x.email !== email));
    pushToast('success', 'User removed');
  }

  return (
    <div style={{ padding: '26px 34px' }}>
      {showStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 26 }}>
          <StatCard icon={<Icon name="user-single" size={19} />} iconBg="var(--tint-indigo-strong)" value={adminStats.totalUsers.toLocaleString()} label="Total Users" />
          <StatCard icon={<Icon name="menu" size={19} />} iconBg="var(--tint-indigo)" value={adminStats.sessions.toLocaleString()} label="Sessions" />
          <StatCard icon={<Icon name="code" size={19} />} iconBg="var(--tint-green)" value={adminStats.codeExecutions} label="Code Executions" />
          <StatCard icon={<Icon name="file-text" size={19} />} iconBg="var(--tint-amber)" value={adminStats.pdfSummaries.toLocaleString()} label="PDF Summaries" />
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
            {(['ALL', 'STUDENT', 'PROFESSOR'] as const).map((r) => (
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
          filtered.map((u) => (
            <div
              key={u.email}
              style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 0.6fr', gap: 12, padding: '14px 20px', alignItems: 'center', borderTop: '1px solid var(--surface-muted)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: u.avatarBg, color: u.avatarColor }}>
                  {u.initials}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{u.email}</span>
              <span>
                <span className={`badge ${badgeClass[u.role]}`}>{u.role}</span>
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{u.joined}</span>
              <span style={{ color: 'var(--icon-danger-muted)', cursor: 'pointer', textAlign: 'center' }} onClick={() => deleteUser(u.email)}>
                <Icon name="trash" size={16} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
