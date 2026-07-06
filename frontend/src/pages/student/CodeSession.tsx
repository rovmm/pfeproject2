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

export default function StudentCodeSession() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<ReturnType<typeof toDisplaySession> & { exercisePrompt?: string } | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<{ ok: boolean; text: string; ms: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  useBreadcrumb(['Sessions', session?.title ?? '']);

  useEffect(() => {
    if (!id) return;
    sessionApi.getById(Number(id)).then((s) => {
      setSession({ ...toDisplaySession(s), exercisePrompt: s.exercisePrompt });
    });
  }, [id]);

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
        const res = await codeApi.execute({ code, language: language as any });
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
      </div>
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
          </div>
        </div>

        <div className="editor-shell" style={{ flex: 1, minWidth: 0 }}>
          <div className="editor-toolbar">
            <div className="editor-lang-pill" style={{ cursor: 'default' }}>
              <Icon name="code" size={14} /> {session.language ?? 'PYTHON'}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
              <button className="editor-btn" onClick={() => run(false)} disabled={running}>
                <Icon name="play" size={14} /> Run
              </button>
              <button className="editor-btn editor-btn-primary" onClick={() => run(true)} disabled={running}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
