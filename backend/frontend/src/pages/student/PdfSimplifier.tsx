import { useEffect, useRef, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import { pdfApi } from '../../api/pdf.api';
import type { PdfSummaryResponse } from '../../types';
import { useToast } from '../../components/Toast';

export default function PdfSimplifier() {
  useBreadcrumb(['PDF Simplifier']);
  const pushToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [simplifying, setSimplifying] = useState(false);
  const [result, setResult] = useState<PdfSummaryResponse | null>(null);
  const [history, setHistory] = useState<PdfSummaryResponse[]>([]);

  useEffect(() => {
    pdfApi
      .history()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  function simplify() {
    if (!file) return;
    setSimplifying(true);
    pdfApi
      .summarize(file)
      .then((res) => {
        setResult(res);
        setHistory((h) => [res, ...h]);
        pushToast('success', 'Summary generated');
      })
      .catch(() => {
        pushToast('error', 'Failed to generate summary');
      })
      .finally(() => setSimplifying(false));
  }

  return (
    <div style={{ padding: '28px 34px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 340 }}>
        <div
          onClick={() => fileInput.current?.click()}
          style={{
            border: '2px dashed var(--border-dashed)',
            borderRadius: 18,
            padding: 40,
            textAlign: 'center',
            background: 'linear-gradient(180deg,var(--surface-alt),var(--tint-indigo-strong))',
            cursor: 'pointer',
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--tint-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--navy)' }}>
            <Icon name="file-text" size={28} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Drop a PDF here</div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '7px 0 16px' }}>or click to browse · max 20 MB</p>
          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInput.current?.click(); }}>
            Browse files
          </button>
        </div>

        {file && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '14px 16px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--error-bg)', color: 'var(--error-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
              PDF
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{file.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={simplify} disabled={simplifying}>
              <Icon name="sparkles" size={14} /> {simplifying ? 'Simplifying…' : 'Simplify'}
            </button>
          </div>
        )}

        {result && (
          <div className="card" style={{ marginTop: 20, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <Badge kind="quiz">
                <Icon name="sparkles" size={11} /> AI SUMMARY
              </Badge>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 10 }}>{result.fileName}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
              {result.summary}
            </p>
          </div>
        )}
      </div>

      <div style={{ width: 230, flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: '0 0 12px' }}>Past summaries</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 && (
            <p style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>No summaries yet.</p>
          )}
          {history.map((p, i) => (
            <div
              key={`${p.fileName}-${i}`}
              className="card"
              style={{ padding: '12px 14px', cursor: 'pointer' }}
              onClick={() => setResult(p)}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{p.fileName}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>{p.pageCount} pages</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
