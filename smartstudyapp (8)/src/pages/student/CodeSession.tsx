import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Badge from '../../components/Badge';
import Icon from '../../components/Icon';
import MonacoPane from '../../components/MonacoPane';
import CodeOutputPanel from '../../components/CodeOutputPanel';
import { exercisePrompt, studentSessions } from '../../lib/mockData';
import { useToast } from '../../components/Toast';

export default function StudentCodeSession() {
  const { id } = useParams();
  const session = studentSessions.find((s) => s.id === id) ?? studentSessions[0];
  useBreadcrumb(['Sessions', session.title]);
  const pushToast = useToast();
  const [code, setCode] = useState(exercisePrompt.starterCode);
  const [output, setOutput] = useState<{ ok: boolean; text: string; ms: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  function run(submit = false) {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setOutput({ ok: true, text: '120', ms: 42 });
      if (submit) pushToast('success', 'Solution submitted');
    }, 500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 26px' }}>
        <Badge kind={session.status}>{session.status.toUpperCase()}</Badge>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 18, padding: '0 26px 20px', minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge kind="python">{exercisePrompt.language}</Badge>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{exercisePrompt.professor}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 10 }}>
              {exercisePrompt.title}
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-secondary)', margin: 0 }}>{exercisePrompt.body}</p>
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 8 }}>EXAMPLE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink-secondary)', lineHeight: 1.7 }}>
              input:&nbsp;&nbsp;{exercisePrompt.example.input}
              <br />
              output: {exercisePrompt.example.output}
            </div>
          </div>
        </div>

        <div className="editor-shell" style={{ flex: 1, minWidth: 0 }}>
          <div className="editor-toolbar">
            <div className="editor-lang-pill" style={{ cursor: 'default' }}>
              <Icon name="code" size={14} /> {exercisePrompt.language === 'PYTHON' ? 'Python 3.11' : exercisePrompt.language}
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
            <MonacoPane language="Python 3.11" value={code} onChange={setCode} />
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
