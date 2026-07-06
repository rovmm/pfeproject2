import { useRef, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import { pastSummaries } from '../../lib/mockData';
import { useToast } from '../../components/Toast';

export default function PdfSimplifier() {
  useBreadcrumb(['PDF Simplifier']);
  const pushToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('lecture-04-databases.pdf');
  const [simplifying, setSimplifying] = useState(false);
  const [summary, setSummary] = useState<string | null>(
    'Chapter 4 — Relational Databases',
  );

  function simplify() {
    setSimplifying(true);
    setTimeout(() => {
      setSimplifying(false);
      setSummary('Chapter 4 — Relational Databases');
      pushToast('success', 'Summary generated');
    }, 900);
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
            onChange={(e) => e.target.files?.[0] && setFileName(e.target.files[0].name)}
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

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '14px 16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--error-bg)', color: 'var(--error-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
            PDF
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{fileName}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>1.8 MB · 12 pages</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={simplify} disabled={simplifying}>
            <Icon name="sparkles" size={14} /> {simplifying ? 'Simplifying…' : 'Simplify'}
          </button>
        </div>

        {summary && (
          <div className="card" style={{ marginTop: 20, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <Badge kind="quiz">
                <Icon name="sparkles" size={11} /> AI SUMMARY
              </Badge>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>generated in 3.2s</span>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 10 }}>{summary}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <li style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
                A <b>relational database</b> stores data in tables (relations) made of rows and columns.
              </li>
              <li style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
                <b>Primary keys</b> uniquely identify rows; <b>foreign keys</b> link tables together.
              </li>
              <li style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
                <b>Normalization</b> reduces redundancy by splitting data across related tables.
              </li>
              <li style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
                SQL <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--tint-indigo)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>JOIN</code> combines rows from two or
                more tables based on a related column.
              </li>
            </ul>
          </div>
        )}
      </div>

      <div style={{ width: 230, flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: '0 0 12px' }}>Past summaries</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pastSummaries.map((p) => (
            <div key={p.name} className="card" style={{ padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>{p.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
