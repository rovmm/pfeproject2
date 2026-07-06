import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import { sessionApi } from '../../api/session.api';
import { toDisplaySession } from '../../lib/sessionMapper';
import { useToast } from '../../components/Toast';

const CODE_LEN = 6;

export default function StudentDashboard() {
  useBreadcrumb(['Dashboard']);
  const navigate = useNavigate();
  const pushToast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ReturnType<typeof toDisplaySession>[]>([]);

  useEffect(() => {
    sessionApi
      .getMyStudentSessions()
      .then((data) => setSessions(data.map(toDisplaySession)))
      .catch(() => pushToast('error', 'Could not load your sessions'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin() {
    if (code.length < CODE_LEN) {
      pushToast('error', 'Invalid join code');
      return;
    }
    try {
      const session = await sessionApi.join(code);
      const display = toDisplaySession(session);
      setSessions((prev) => [display, ...prev.filter((s) => s.id !== display.id)]);
      navigate(display.type === 'code' ? `/student/session/${display.id}/code` : `/student/session/${display.id}/quiz`);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Invalid join code');
    }
  }

  const chars = code.padEnd(CODE_LEN, ' ').split('');

  return (
    <div style={{ padding: '0 40px 40px' }}>
      <section style={{ textAlign: 'center', padding: '52px 0 40px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 38, letterSpacing: '-0.025em', margin: 0, color: 'var(--ink)' }}>
          Ready to learn today?
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-muted)', margin: '12px 0 0' }}>Enter the 6-character code your professor shared.</p>
        <div style={{ margin: '30px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {chars.map((ch, i) => (
              <span
                key={i}
                style={{
                  width: 52,
                  height: 62,
                  border: `1.5px solid ${i === code.length ? 'var(--navy)' : 'var(--border-input)'}`,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 26,
                  color: ch.trim() ? 'var(--ink)' : 'var(--ink-faint)',
                  background: i === code.length ? '#eef3fb' : 'var(--surface)',
                }}
              >
                {ch.trim() || '·'}
              </span>
            ))}
            <input
              aria-label="Join code"
              autoFocus
              value={code}
              maxLength={CODE_LEN}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, border: 'none', outline: 'none', cursor: 'text' }}
            />
          </div>
          <button className="btn btn-primary btn-lg" style={{ height: 62 }} onClick={handleJoin}>
            Join <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', gap: 44, marginBottom: 14 }}>
        {[
          { icon: 'code' as const, label: 'Code Editor', bg: 'var(--tint-indigo-strong)', to: '/student/editor' },
          { icon: 'file-text' as const, label: 'PDF Simplifier', bg: 'var(--tint-green)', to: '/student/pdf' },
          { icon: 'bar-chart' as const, label: 'My Results', bg: 'var(--tint-indigo)', to: '/student/session/s2/results' },
        ].map((a) => (
          <Link key={a.label} to={a.to} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)' }}>
              <Icon name={a.icon} size={26} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-secondary)' }}>{a.label}</span>
          </Link>
        ))}
      </section>

      <section style={{ maxWidth: 1000, margin: '36px auto 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ marginRight: 9, color: 'var(--ink-secondary)' }}>
            <Icon name="clock" size={18} />
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, margin: 0, color: 'var(--ink)' }}>My Sessions</h2>
          {sessions.length > 0 && (
            <a href="#" style={{ marginLeft: 'auto', fontSize: 13.5, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              See all ›
            </a>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Icon name="grad-cap" size={26} />}
            title="No sessions yet"
            message="Join your first session with a code above to see it here."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {sessions.map((s) => (
              <div key={s.id} className="card card-pad" style={s.status === 'closed' ? { opacity: 0.72 } : undefined}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Badge kind={s.status}>{s.status.toUpperCase()}</Badge>
                  <Badge kind={s.type === 'code' ? (s.language?.toLowerCase() as 'python' | 'java') ?? 'python' : 'quiz'}>
                    {s.type === 'code' ? s.language : 'QUIZ'}
                  </Badge>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 5 }}>
                  {s.professor} · {s.when}
                </div>
                <Button
                  variant={s.status === 'open' ? 'secondary' : 'ghost'}
                  full
                  style={{ marginTop: 16, ...(s.status === 'closed' ? { border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--ink-muted)' } : {}) }}
                  onClick={() => navigate(s.status === 'open' ? `/student/session/${s.id}/${s.type}` : `/student/session/${s.id}/results`)}
                >
                  {s.status === 'open' ? 'Continue' : 'View result'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
