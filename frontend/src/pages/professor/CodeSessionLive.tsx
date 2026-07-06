import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import { professorSessions, liveSubmissions } from '../../lib/mockData';
import { useToast } from '../../components/Toast';

const statusBadge: Record<string, { color: string; bg: string }> = {
  PASSED: { color: 'var(--success)', bg: 'var(--success-bg)' },
  WORKING: { color: 'var(--amber-strong)', bg: 'var(--tint-amber)' },
  ERROR: { color: 'var(--error-strong)', bg: 'var(--error-bg)' },
};

export default function ProfessorCodeSessionLive() {
  const { id } = useParams();
  const session = professorSessions.find((s) => s.id === id) ?? professorSessions[0];
  useBreadcrumb(['Sessions', session.title]);
  const pushToast = useToast();

  return (
    <div style={{ display: 'flex', gap: 20, padding: '22px 26px', height: '100%', minHeight: 0 }}>
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>JOIN CODE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32, letterSpacing: '0.16em', color: 'var(--navy)' }}>{session.joinCode}</div>
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: 14 }}
            onClick={() => {
              navigator.clipboard?.writeText(session.joinCode);
              pushToast('info', 'Code copied');
            }}
          >
            <Icon name="copy" size={14} /> Copy code
          </button>
        </div>
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Badge kind="python">{session.language}</Badge>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{session.filiere}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{session.title}</div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-secondary)', margin: 0 }}>
            Write a recursive factorial(n). Read n from stdin, print n!.
          </p>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{session.studentsJoined}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--success)' }}>18</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Submitted</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--amber)' }}>6</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Working</div>
          </div>
        </div>
        <button
          className="btn btn-danger"
          style={{ marginTop: 'auto' }}
          onClick={() => pushToast('info', 'Session closed')}
        >
          Close session
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: 0 }}>Live submissions</h2>
          <span style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--ink-faint)' }}>polling every 5s</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
          {liveSubmissions.map((sub) => {
            const st = statusBadge[sub.status];
            return (
              <div key={sub.name} className="card card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: sub.avatarBg, color: sub.avatarColor }}>
                    {sub.initials}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{sub.name}</span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 999 }}
                  >
                    {sub.status}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    color: sub.status === 'ERROR' ? 'var(--error-strong)' : sub.status === 'WORKING' ? 'var(--ink-faint)' : 'var(--ink-muted)',
                    background: sub.status === 'ERROR' ? 'var(--error-input-bg)' : 'var(--surface-alt)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                    fontStyle: sub.status === 'WORKING' ? 'italic' : 'normal',
                  }}
                >
                  {sub.code}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
