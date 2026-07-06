import { useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import LanguageSelector from '../../components/LanguageSelector';
import MonacoPane from '../../components/MonacoPane';
import CodeOutputPanel from '../../components/CodeOutputPanel';
import { codeHistory } from '../../lib/mockData';

const DEFAULT_CODE = `import math

nums = [4, 9, 16]
for n in nums:
    print(math.sqrt(n))`;

export default function CodeEditor() {
  useBreadcrumb(['Code Editor']);
  const [language, setLanguage] = useState('Python 3.11');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [output, setOutput] = useState<{ ok: boolean; text: string; ms: number } | null>({ ok: true, text: '2.0\n3.0\n4.0', ms: 38 });
  const [analyzed, setAnalyzed] = useState(false);

  function run() {
    setOutput({ ok: true, text: '2.0\n3.0\n4.0', ms: 38 });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px' }}>
        <LanguageSelector value={language} onChange={setLanguage} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
          <button className="btn btn-secondary btn-sm" onClick={run}>
            <Icon name="play" size={14} /> Run
          </button>
          <button className="btn btn-secondary btn-sm" style={{ color: 'var(--navy-light)' }} onClick={() => setAnalyzed(true)}>
            <Icon name="sparkles" size={14} /> AI Analyze
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--editor-bg)' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MonacoPane language={language} value={code} onChange={setCode} />
          </div>
          <div
            style={{ borderTop: '1px solid var(--editor-border)', background: 'var(--editor-gutter)', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setShowStdin((s) => !s)}
          >
            <span className="output-label">
              <Icon name={showStdin ? 'chevron-up' : 'chevron-down'} size={12} /> STDIN
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--editor-gutter-text)', fontStyle: 'italic' }}>(optional input passed to your program)</span>
          </div>
          {showStdin && (
            <div style={{ background: 'var(--editor-gutter)', padding: '0 14px 12px' }}>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--editor-header)',
                  border: '1px solid var(--editor-border)',
                  borderRadius: 8,
                  color: 'var(--editor-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  padding: 8,
                  resize: 'vertical',
                }}
              />
            </div>
          )}
          {output && (
            <div style={{ background: 'var(--editor-header)' }}>
              <CodeOutputPanel status={output.ok ? 'success' : 'error'} durationMs={output.ms} output={output.text} />
              {analyzed && (
                <div style={{ padding: '0 14px 14px', fontSize: 12.5, color: 'var(--editor-text)', lineHeight: 1.6 }}>
                  Loop looks efficient. Consider a list comprehension for conciseness: <code>[math.sqrt(n) for n in nums]</code>.
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            width: historyOpen ? 240 : 0,
            flexShrink: 0,
            background: 'var(--surface)',
            borderLeft: historyOpen ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-muted)', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>History</span>
            <span onClick={() => setHistoryOpen(false)} style={{ marginLeft: 'auto', color: '#aa9f88', fontSize: 15, cursor: 'pointer' }}>
              <Icon name="chevron-right" size={15} />
            </span>
          </div>
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {codeHistory.map((h) => (
              <div key={h.desc} className="card" style={{ padding: '11px 12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: h.ok ? 'var(--success)' : 'var(--error)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{h.label}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-placeholder)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{h.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{h.when}</div>
              </div>
            ))}
          </div>
        </div>
        {!historyOpen && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="btn btn-ghost"
            style={{ position: 'absolute', right: 10, top: 70 }}
          >
            <Icon name="chevron-left" size={14} /> History
          </button>
        )}
      </div>
    </div>
  );
}
