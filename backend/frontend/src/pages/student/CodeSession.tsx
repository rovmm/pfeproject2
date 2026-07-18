import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Badge from '../../components/Badge';
import Icon from '../../components/Icon';
import MonacoPane from '../../components/MonacoPane';
import CodeOutputPanel from '../../components/CodeOutputPanel';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import { codeApi } from '../../api/code.api';
import { toDisplaySession } from '../../lib/sessionMapper';
import { useSecurityFlags } from '../../hooks/useSecurityFlags';
import { useCodingHistory } from '../../hooks/useCodingHistory';
import { useAiRestriction } from '../../lib/aiRestriction';

type SessionWithFlags = ReturnType<typeof toDisplaySession> & {
  exercisePrompt?: string;
  allowAI: boolean;
  disableCopyPaste: boolean;
  warnOnTabSwitch: boolean;
  autoSave: boolean;
  timeLimitMinutes: number;
  recordCodingHistory: boolean;
};

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudentCodeSession() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<SessionWithFlags | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<{ ok: boolean; text: string; ms: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const { setAiRestricted } = useAiRestriction();

  useBreadcrumb(['Sessions', session?.title ?? '']);

  useEffect(() => {
    if (session && session.allowAI === false && session.status === 'open') {
      setAiRestricted(true, `/student/session/${session.id}/code`);
    } else {
      setAiRestricted(false);
    }
    return () => setAiRestricted(false);
  }, [session?.allowAI, session?.status, session?.id, setAiRestricted]);

  useEffect(() => {
    if (!id) return;
    sessionApi.getById(Number(id)).then((s) => {
      setSession({
        ...toDisplaySession(s),
        exercisePrompt: s.exercisePrompt,
        allowAI: s.allowAI,
        disableCopyPaste: s.disableCopyPaste,
        warnOnTabSwitch: s.warnOnTabSwitch,
        autoSave: s.autoSave,
        timeLimitMinutes: s.timeLimitMinutes,
        recordCodingHistory: s.recordCodingHistory,
      });
      if (s.timeLimitMinutes > 0) setSecondsLeft(s.timeLimitMinutes * 60);
    });
  }, [id]);

  useSecurityFlags({
    disableCopyPaste: session?.disableCopyPaste ?? false,
    warnOnTabSwitch: session?.warnOnTabSwitch ?? false,
  });

  useEffect(() => {
    if (!session || session.status !== 'open') return;
    const sessionId = Number(session.id);
    sessionApi.heartbeat(sessionId).catch(() => {});
    const interval = setInterval(() => {
      sessionApi.heartbeat(sessionId).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  const { editCount } = useCodingHistory({
    sessionId: Number(session?.id ?? 0),
    code,
    language: session?.language ?? 'PYTHON',
    enabled: session?.recordCodingHistory ?? false,
    autoSave: session?.autoSave ?? false,
  });

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev === null ? null : Math.max(prev - 1, 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft !== null]);

  useEffect(() => {
    if (!bannerVisible) return;
    const timeout = setTimeout(() => setBannerVisible(false), 5000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const timeUp = secondsLeft !== null && secondsLeft <= 0;

  const activeRestrictions: string[] = [];
  if (session?.disableCopyPaste) activeRestrictions.push('Copy/paste disabled');
  if (session?.warnOnTabSwitch) activeRestrictions.push('Tab switch monitoring');
  if (session?.timeLimitMinutes) activeRestrictions.push(`${session.timeLimitMinutes} min time limit`);
  if (session?.allowAI === false) activeRestrictions.push('Solve disabled');

  async function run(submit = false) {
    if (!session) return;
    setRunning(true);
    try {
      const language = (session.language ?? 'PYTHON').toLowerCase();
      if (submit) {
        const result = await sessionApi.submitCode(Number(session.id), code, language);
        setOutput({ ok: result.status === 'SUCCESS', text: result.stdout || result.stderr || '', ms: result.executionTimeMs });
        pushToast('success', 'Solution submitted');
      } else {
        const res = await codeApi.execute({ code, language: language as any, sessionId: Number(session.id) });
        setOutput({ ok: res.success, text: res.success ? res.output : res.error, ms: res.executionTimeMs });
      }
    } catch (err: any) {
      setOutput({ ok: false, text: err.response?.data?.message || 'Execution failed.', ms: 0 });
    } finally {
      setRunning(false);
    }
  }

  if (!session) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 26px' }}>
        <Badge kind={session.status}>{session.status.toUpperCase()}</Badge>
        {secondsLeft !== null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 13,
              color: secondsLeft < 300 ? 'var(--error-strong)' : 'var(--ink-secondary)',
            }}
          >
            <Icon name="clock" size={14} /> {formatClock(secondsLeft)}
          </span>
        )}
      </div>
      {timeUp && (
        <div style={{ margin: '0 26px 12px', padding: '10px 16px', borderRadius: 11, background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-strong)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="alert-triangle" size={14} /> Time is up!
        </div>
      )}
      {bannerVisible && activeRestrictions.length > 0 && (
        <div
          style={{
            margin: '0 26px 12px',
            padding: '10px 16px',
            borderRadius: 11,
            background: 'var(--tint-amber)',
            border: '1px solid var(--tint-amber-border)',
            color: 'var(--amber-strong)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={13} /> Session restrictions: {activeRestrictions.join(', ')}
          </span>
          <button
            onClick={() => setBannerVisible(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--amber-strong)', display: 'flex' }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', gap: 18, padding: '0 26px 20px', minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge kind="python">{session.language ?? 'PYTHON'}</Badge>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{session.professor}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 10 }}>
              {session.title}
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{session.exercisePrompt}</p>
            {session.recordCodingHistory && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-muted)' }}>
                <Icon name="bar-chart" size={12} /> {editCount} edit{editCount === 1 ? '' : 's'} recorded
              </div>
            )}
          </div>
        </div>

        <div className="editor-shell" style={{ flex: 1, minWidth: 0 }}>
          <div className="editor-toolbar">
            <div className="editor-lang-pill" style={{ cursor: 'default' }}>
              <Icon name="code" size={14} /> {session.language ?? 'PYTHON'}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
              <button className="editor-btn" onClick={() => run(false)} disabled={running || timeUp}>
                <Icon name="play" size={14} /> Run
              </button>
              <button className="editor-btn editor-btn-primary" onClick={() => run(true)} disabled={running || timeUp}>
                Submit
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MonacoPane language={session.language ?? 'PYTHON'} value={code} onChange={setCode} />
          </div>
          {output && (
            <>
              <CodeOutputPanel status={output.ok ? 'success' : 'error'} durationMs={output.ms} output={output.text} />
              {session.allowAI && (
                <div style={{ padding: '0 14px 14px', background: 'var(--editor-gutter)' }}>
                  <button className="editor-btn" onClick={() => setAnalyzed(true)}>
                    <Icon name="sparkles" size={14} /> AI Analyze
                  </button>
                  {analyzed && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--editor-text)', lineHeight: 1.6 }}>
                      Clean recursive solution. Base case is correct; consider an iterative version to avoid stack depth limits for large n.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
