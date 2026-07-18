import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { SkeletonTableRow } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import { toProfessorDisplay } from '../../lib/sessionMapper';
import type { CodingHistoryResponse, ParticipantPresenceResponse, StudentSubmissionResponse } from '../../types';

const statusBadge: Record<string, { color: string; bg: string }> = {
  SUCCESS: { color: 'var(--success)', bg: 'var(--success-bg)' },
  PENDING: { color: 'var(--amber-strong)', bg: 'var(--tint-amber)' },
  ERROR: { color: 'var(--error-strong)', bg: 'var(--error-bg)' },
  TIMEOUT: { color: 'var(--error-strong)', bg: 'var(--error-bg)' },
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

type ProfessorSession = ReturnType<typeof toProfessorDisplay> & {
  exercisePrompt?: string;
  recordCodingHistory: boolean;
};

export default function ProfessorCodeSessionLive() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<ProfessorSession | null>(null);
  const [tab, setTab] = useState<'submissions' | 'history'>('submissions');
  const [submissions, setSubmissions] = useState<StudentSubmissionResponse[]>([]);
  const [presence, setPresence] = useState<ParticipantPresenceResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useBreadcrumb(['Sessions', session?.title ?? '']);

  useEffect(() => {
    if (!id) return;
    sessionApi
      .getById(Number(id))
      .then((s) =>
        setSession({
          ...toProfessorDisplay(s),
          exercisePrompt: s.exercisePrompt,
          recordCodingHistory: s.recordCodingHistory,
        }),
      )
      .catch(() => pushToast('error', 'Could not load session'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const sessionId = Number(id);
    let cancelled = false;

    function poll() {
      Promise.all([sessionApi.getSubmissions(sessionId), sessionApi.getPresence(sessionId)])
        .then(([subs, pres]) => {
          if (cancelled) return;
          setSubmissions(subs);
          setPresence(pres);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingSubmissions(false);
        });
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  async function closeSession() {
    if (!id) return;
    try {
      await sessionApi.close(Number(id));
      setSession((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      pushToast('info', 'Session closed');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not close the session');
    }
  }

  if (!session) return null;

  const submissionByStudentId = new Map(submissions.map((s) => [s.studentId, s]));
  const submittedCount = submissions.length;
  const workingCount = presence.filter((p) => p.online && !submissionByStudentId.has(p.studentId)).length;

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
          <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {session.exercisePrompt}
          </p>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{presence.length}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--success)' }}>{submittedCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Submitted</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--amber)' }}>{workingCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Working</div>
          </div>
        </div>
        <button
          className="btn btn-danger"
          style={{ marginTop: 'auto' }}
          disabled={session.status === 'closed'}
          onClick={closeSession}
        >
          {session.status === 'closed' ? 'Session closed' : 'Close session'}
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
        ) : loadingSubmissions ? (
          <div className="card">
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
          </div>
        ) : presence.length === 0 ? (
          <EmptyState
            icon={<Icon name="user-check" size={26} />}
            title="No students yet"
            message="Share the join code — students who join will show up here."
          />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
            {presence.map((p) => {
              const sub = submissionByStudentId.get(p.studentId);
              const status = sub?.status ?? 'PENDING';
              const st = statusBadge[status];
              const body = sub ? (sub.stderr || sub.stdout || '') : '';
              return (
                <div key={p.studentId} className="card card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                    <span
                      title={p.online ? 'Online' : 'Left the session'}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: p.online ? 'var(--success)' : 'var(--ink-faint)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.studentName}</span>
                    <span style={{ fontSize: 10.5, color: p.online ? 'var(--success)' : 'var(--ink-faint)' }}>
                      {p.online ? 'Online' : 'Left'}
                    </span>
                    <span
                      style={{ marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 999 }}
                    >
                      {sub ? status : 'WORKING'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      color: status === 'ERROR' || status === 'TIMEOUT' ? 'var(--error-strong)' : 'var(--ink-muted)',
                      background: status === 'ERROR' || status === 'TIMEOUT' ? 'var(--error-input-bg)' : 'var(--surface-alt)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      whiteSpace: 'pre',
                      overflow: 'hidden',
                      fontStyle: sub ? 'normal' : 'italic',
                    }}
                  >
                    {sub ? sub.code.split('\n').slice(0, 4).join('\n') : 'No submission yet…'}
                    {sub && body && (
                      <>
                        {'\n\n'}
                        {body.split('\n').slice(0, 2).join('\n')}
                      </>
                    )}
                  </div>
                  {sub && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-faint)' }}>
                      Submitted {fmtDateTime(sub.submittedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
