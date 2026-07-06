import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { SkeletonTableRow } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import type { CodingHistoryResponse, SessionResponse, StudentSubmissionResponse } from '../../types';

const AVATAR_PALETTE = [
  { bg: 'var(--tint-indigo-strong)', color: 'var(--blue-accent)' },
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

const statusBadge: Record<string, { color: string; bg: string; label: string }> = {
  SUCCESS: { color: 'var(--success)', bg: 'var(--success-bg)', label: 'PASSED' },
  ERROR: { color: 'var(--error-strong)', bg: 'var(--error-bg)', label: 'ERROR' },
  TIMEOUT: { color: 'var(--error-strong)', bg: 'var(--error-bg)', label: 'TIMEOUT' },
  PENDING: { color: 'var(--amber-strong)', bg: 'var(--tint-amber)', label: 'WORKING' },
};

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function durationBetween(startIso: string, endIso: string | null) {
  if (!endIso) return '—';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms <= 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CodingHistoryTab({ sessionId }: { sessionId: number }) {
  const pushToast = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CodingHistoryResponse[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    sessionApi
      .getCodingHistory(sessionId)
      .then(setHistory)
      .catch(() => pushToast('error', 'Could not load coding history'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <div className="card">
        <SkeletonTableRow />
        <SkeletonTableRow />
        <SkeletonTableRow />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="bar-chart" size={26} />}
        title="No coding history yet"
        message="Once students start editing, their activity will show up here."
      />
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1.4fr 1.4fr 1fr',
          gap: 8,
          padding: '11px 16px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'var(--ink-muted)',
          borderBottom: '1px solid var(--surface-muted)',
        }}
      >
        <span>STUDENT</span>
        <span>EDIT COUNT</span>
        <span>STARTED AT</span>
        <span>SUBMITTED AT</span>
        <span>ACTIONS</span>
      </div>
      {history.map((h) => (
        <div key={h.studentId}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1.4fr 1.4fr 1fr',
              gap: 8,
              alignItems: 'center',
              padding: '13px 16px',
              borderBottom: '1px solid var(--surface-muted)',
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{h.studentName}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{h.editCount}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{fmtDateTime(h.startedAt)}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{fmtDateTime(h.submittedAt)}</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--border)' }}
              onClick={() => setExpanded(expanded === h.studentId ? null : h.studentId)}
            >
              {expanded === h.studentId ? 'Hide' : 'View Timeline'}
            </button>
          </div>
          {expanded === h.studentId && (
            <div style={{ padding: '10px 16px 16px', background: 'var(--surface-alt)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>
                Total time: {durationBetween(h.startedAt, h.submittedAt ?? h.snapshots[h.snapshots.length - 1]?.timestamp ?? null)}
              </div>
              {h.snapshots.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>No snapshots recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {h.snapshots.map((snap, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', minWidth: 90 }}>{fmtDateTime(snap.timestamp)}</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: 'var(--ink-secondary)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          whiteSpace: 'pre',
                          flex: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {snap.code.split('\n').slice(0, 3).join('\n')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LiveSubmissionsTab({ sessionId, studentCount }: { sessionId: number; studentCount: number }) {
  const pushToast = useToast();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<StudentSubmissionResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      sessionApi
        .getSubmissions(sessionId)
        .then((data) => {
          if (!cancelled) setSubmissions(data);
        })
        .catch(() => {
          if (!cancelled) pushToast('error', 'Could not load submissions');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const submittedCount = submissions.length;
  const workingCount = Math.max(studentCount - submittedCount, 0);

  return (
    <>
      <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          <strong style={{ color: 'var(--success)' }}>{submittedCount}</strong> submitted ·{' '}
          <strong style={{ color: 'var(--amber-strong)' }}>{workingCount}</strong> working
        </div>
      </div>
      {loading ? (
        <div className="card">
          <SkeletonTableRow />
          <SkeletonTableRow />
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<Icon name="bar-chart" size={26} />}
          title="No submissions yet"
          message="Once students submit their code, it will show up here."
        />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
          {submissions.map((sub) => {
            const st = statusBadge[sub.status] ?? statusBadge.PENDING;
            const avatar = avatarFor(sub.studentName);
            return (
              <div key={sub.id} className="card card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: avatar.bg, color: avatar.color }}>
                    {initialsOf(sub.studentName)}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{sub.studentName}</span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 999 }}
                  >
                    {st.label}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11.5,
                    color: sub.status === 'ERROR' || sub.status === 'TIMEOUT' ? 'var(--error-strong)' : 'var(--ink-muted)',
                    background: sub.status === 'ERROR' || sub.status === 'TIMEOUT' ? 'var(--error-input-bg)' : 'var(--surface-alt)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                  }}
                >
                  {sub.code}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProfessorCodeSessionLive() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [tab, setTab] = useState<'submissions' | 'history'>('submissions');

  useEffect(() => {
    if (!id) return;
    sessionApi
      .getById(Number(id))
      .then(setSession)
      .catch(() => pushToast('error', 'Could not load session'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useBreadcrumb(['Sessions', session?.title ?? '…']);

  if (!session) {
    return (
      <div style={{ padding: '22px 26px' }}>
        <SkeletonTableRow />
      </div>
    );
  }

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
            {session.filiere && <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{session.filiere}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 8 }}>{session.title}</div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-secondary)', margin: 0 }}>
            {session.exercisePrompt}
          </p>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{session.studentCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
        </div>
        <button
          className="btn btn-danger"
          style={{ marginTop: 'auto' }}
          onClick={() => {
            sessionApi
              .close(session.id)
              .then(() => pushToast('info', 'Session closed'))
              .catch(() => pushToast('error', 'Could not close session'));
          }}
        >
          Close session
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <button
            className="btn btn-sm"
            onClick={() => setTab('submissions')}
            style={{
              background: tab === 'submissions' ? 'var(--tint-indigo)' : 'transparent',
              color: tab === 'submissions' ? 'var(--navy)' : 'var(--ink-muted)',
            }}
          >
            Live submissions
          </button>
          {session.recordCodingHistory && (
            <button
              className="btn btn-sm"
              onClick={() => setTab('history')}
              style={{
                background: tab === 'history' ? 'var(--tint-indigo)' : 'transparent',
                color: tab === 'history' ? 'var(--navy)' : 'var(--ink-muted)',
              }}
            >
              Coding History
            </button>
          )}
          {tab === 'submissions' && <span style={{ marginLeft: 10, fontSize: 11.5, color: 'var(--ink-faint)' }}>polling every 5s</span>}
        </div>
        {tab === 'history' && id ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CodingHistoryTab sessionId={Number(id)} />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <LiveSubmissionsTab sessionId={session.id} studentCount={session.studentCount} />
          </div>
        )}
      </div>
    </div>
  );
}
