import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import Icon from '../Icon';
import FileIcon from './FileIcon';
import EmptyState from '../EmptyState';
import { useToast } from '../Toast';
import { driveApi } from '../../api/drive.api';
import type { FileResponse } from '../../types/drive.types';
import { canPreview, formatFileSize, getMonacoLanguage, isCodeFile, isImageFile, isPdfFile } from '../../utils/driveUtils';

const LARGE_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
const LARGE_TEXT_BYTES = 500 * 1024; // 500 KB
const TRUNCATE_LINES = 500;

export default function FilePreviewModal({ file, onClose }: { file: FileResponse | null; onClose: () => void }) {
  const pushToast = useToast();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!file) return;

    setPreviewUrl(null);
    setTextContent(null);
    setTruncated(false);
    setError(null);

    if (!canPreview(file.fileType)) {
      setError('Preview not available for this file type');
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);

    driveApi
      .previewFile(file.id)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setPreviewUrl(url);

        if (isCodeFile(file.fileType)) {
          fetch(url)
            .then((r) => r.text())
            .then((text) => {
              if (cancelled) return;
              if (file.fileSize > LARGE_TEXT_BYTES) {
                const lines = text.split('\n').slice(0, TRUNCATE_LINES);
                setTextContent(lines.join('\n') + '\n\n// ... file truncated at 500 lines');
                setTruncated(true);
              } else {
                setTextContent(text);
              }
            })
            .catch(() => {
              if (!cancelled) setError('Could not read file content');
            });
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Preview not available for this file type');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id]);

  if (!file) return null;

  const ext = file.fileType.toLowerCase();
  const isLargePdf = isPdfFile(ext) && file.fileSize > LARGE_PDF_BYTES;

  function download() {
    if (!file) return;
    driveApi.downloadFile(file.id, file.originalName).catch(() => pushToast('error', 'Could not download file'));
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 20, 39, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '5vh 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: '100%',
          maxWidth: 1100,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <FileIcon fileType={file.fileType} size="md" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              title={file.originalName}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 14.5,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {file.originalName}
            </div>
            <span className="badge badge-chip" style={{ color: 'var(--ink-secondary)', background: 'var(--surface-muted)', marginTop: 4 }}>
              {formatFileSize(file.fileSize)}
            </span>
          </div>
          {file.allowDownload && (
            <button className="btn btn-secondary btn-sm" onClick={download}>
              <Icon name="download" size={13} /> Download
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Preview area */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--surface-alt)' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--navy)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Loading preview…</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20 }}>
              <EmptyState icon={<Icon name="alert-triangle" size={26} />} title="Preview not available" message={error} />
              {file.allowDownload && (
                <button className="btn btn-primary btn-sm" onClick={download}>
                  <Icon name="download" size={13} /> Download instead
                </button>
              )}
            </div>
          )}

          {!loading && !error && previewUrl && isPdfFile(ext) && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {isLargePdf && (
                <div
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    color: 'var(--error-strong)',
                    background: 'var(--error-bg)',
                    borderBottom: '1px solid var(--error-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name="alert-triangle" size={13} /> Large file — preview may be slow.
                </div>
              )}
              <iframe src={previewUrl} title={file.originalName} style={{ flex: 1, width: '100%', border: 'none' }} />
            </div>
          )}

          {!loading && !error && previewUrl && isImageFile(ext) && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <img
                src={previewUrl}
                alt={file.originalName}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: 'var(--shadow-card)' }}
              />
            </div>
          )}

          {!loading && !error && isCodeFile(ext) && (
            textContent !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {truncated && (
                  <div
                    style={{
                      padding: '8px 14px',
                      fontSize: 12,
                      color: 'var(--error-strong)',
                      background: 'var(--error-bg)',
                      borderBottom: '1px solid var(--error-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="alert-triangle" size={13} /> File too large to preview in editor — showing first {TRUNCATE_LINES} lines only.
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={getMonacoLanguage(file.fileType)}
                    value={textContent}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--navy)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
