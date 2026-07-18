import { useEffect, useState } from 'react';
import Icon from '../Icon';
import ToggleSwitch from '../ToggleSwitch';
import FileIcon from './FileIcon';
import { useToast } from '../Toast';
import { driveApi } from '../../api/drive.api';
import type { AiFileAction, DriveVisibility, FileResponse } from '../../types/drive.types';
import { canPreview, formatFileSize, isCodeFile } from '../../utils/driveUtils';

const DOC_ACTIONS: { action: AiFileAction; label: string }[] = [
  { action: 'SUMMARIZE', label: 'Summarize' },
  { action: 'EXPLAIN', label: 'Explain' },
  { action: 'KEY_CONCEPTS', label: 'Key Concepts' },
  { action: 'GENERATE_QUIZ', label: 'Generate Quiz' },
  { action: 'GENERATE_FLASHCARDS', label: 'Flashcards' },
  { action: 'GENERATE_EXERCISE', label: 'Generate Exercise' },
];

const CODE_ACTIONS: { action: AiFileAction; label: string }[] = [
  { action: 'EXPLAIN_CODE', label: 'Explain Code' },
  { action: 'DEBUG_CODE', label: 'Debug' },
  { action: 'OPTIMIZE_CODE', label: 'Optimize' },
  { action: 'REVIEW_CODE', label: 'Review Code' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function FileDetailPanel({
  file,
  isProfessor,
  onClose,
  onDelete,
  onUpdate,
  onPreview,
}: {
  file: FileResponse | null;
  isProfessor: boolean;
  onClose: () => void;
  onDelete: (id: number) => void;
  onUpdate: (updated: FileResponse) => void;
  onPreview: (file: FileResponse) => void;
}) {
  const pushToast = useToast();

  const [visibility, setVisibility] = useState<DriveVisibility>('PRIVATE');
  const [visibleFrom, setVisibleFrom] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [activeAction, setActiveAction] = useState<AiFileAction | 'ASK' | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!file) return;
    setVisibility(file.visibility);
    setVisibleFrom(file.visibleFrom ? file.visibleFrom.slice(0, 16) : '');
    setAllowDownload(file.allowDownload);
    setAiResult(null);
    setQuestion('');
    setActiveAction(null);
    setConfirmDelete(false);
  }, [file?.id]);

  if (!file) return null;

  const codeFile = isCodeFile(file.fileType);
  const canDownload = file.allowDownload || isProfessor;

  function download() {
    if (!file) return;
    driveApi.downloadFile(file.id, file.originalName).catch(() => pushToast('error', 'Could not download file'));
  }

  async function saveSettings() {
    if (!file) return;
    setSavingSettings(true);
    try {
      const updated = await driveApi.updateFileSettings(file.id, {
        visibility,
        visibleFrom: visibility === 'HIDDEN_UNTIL_DATE' ? visibleFrom : null,
        allowDownload,
      });
      onUpdate(updated);
      pushToast('success', 'Settings saved');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not save settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function runAction(action: AiFileAction) {
    if (!file || activeAction) return;
    setActiveAction(action);
    setAiResult(null);
    try {
      const res = await driveApi.processWithAi(file.id, action);
      setAiResult(res.result);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'AI action failed');
    } finally {
      setActiveAction(null);
    }
  }

  async function ask() {
    if (!file || !question.trim() || activeAction) return;
    setActiveAction('ASK');
    setAiResult(null);
    try {
      const res = await driveApi.askAboutFile(file.id, question.trim());
      setAiResult(res.result);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'AI question failed');
    } finally {
      setActiveAction(null);
    }
  }

  async function confirmAndDelete() {
    if (!file) return;
    setDeleting(true);
    try {
      await driveApi.deleteFile(file.id);
      pushToast('success', 'File deleted');
      onDelete(file.id);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not delete file');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        height: '100%',
        overflowY: 'auto',
        padding: 16,
        background: 'var(--surface)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 4 }}
        >
          <Icon name="x" size={18} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <FileIcon fileType={file.fileType} size="lg" />
      </div>
      <div
        title={file.originalName}
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 15,
          color: 'var(--ink)',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.originalName}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <span className="badge badge-chip" style={{ color: 'var(--ink-secondary)', background: 'var(--surface-muted)' }}>
          {formatFileSize(file.fileSize)}
        </span>
        <span className="badge badge-chip" style={{ color: 'var(--ink-secondary)', background: 'var(--surface-muted)' }}>
          {file.fileType.toUpperCase()}
        </span>
        <span className="badge badge-chip" style={{ color: 'var(--ink-secondary)', background: 'var(--surface-muted)' }}>
          {formatDate(file.uploadedAt)}
        </span>
      </div>

      {canPreview(file.fileType) && (
        <button className="btn btn-primary btn-sm btn-full" style={{ marginTop: 16 }} onClick={() => onPreview(file)}>
          <Icon name="eye" size={14} /> Preview
        </button>
      )}

      {canDownload && (
        <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: canPreview(file.fileType) ? 8 : 16 }} onClick={download}>
          <Icon name="download" size={14} /> Download
        </button>
      )}

      {isProfessor && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', marginBottom: 10 }}>
            Settings
          </div>
          <label className="field-label">Visibility</label>
          <select
            className="input"
            style={{ marginBottom: 12 }}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as DriveVisibility)}
          >
            <option value="STUDENTS">Visible to Students</option>
            <option value="PRIVATE">Professor Only</option>
            <option value="HIDDEN_UNTIL_DATE">Hidden Until Date</option>
          </select>
          {visibility === 'HIDDEN_UNTIL_DATE' && (
            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Visible from</label>
              <input
                className="input"
                type="datetime-local"
                value={visibleFrom}
                onChange={(e) => setVisibleFrom(e.target.value)}
              />
            </div>
          )}
          <ToggleSwitch label="Allow Download" checked={allowDownload} onChange={setAllowDownload} />
          <button className="btn btn-primary btn-sm btn-full" style={{ marginTop: 10 }} onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)', marginBottom: 10 }}>
          <Icon name="sparkles" size={13} style={{ color: 'var(--navy)' }} /> AI Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DOC_ACTIONS.map((a) => (
            <button
              key={a.action}
              className="btn btn-secondary btn-sm"
              style={{ border: '1px solid var(--border-input)' }}
              onClick={() => runAction(a.action)}
              disabled={activeAction !== null}
            >
              {activeAction === a.action ? '…' : a.label}
            </button>
          ))}
          {codeFile &&
            CODE_ACTIONS.map((a) => (
              <button
                key={a.action}
                className="btn btn-secondary btn-sm"
                style={{ border: '1px solid var(--border-input)' }}
                onClick={() => runAction(a.action)}
                disabled={activeAction !== null}
              >
                {activeAction === a.action ? '…' : a.label}
              </button>
            ))}
        </div>

        {aiResult && (
          <div className="card" style={{ marginTop: 14, padding: '12px 14px', position: 'relative' }}>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(aiResult);
                pushToast('info', 'Copied to clipboard');
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '4px 8px',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
              }}
            >
              <Icon name="copy" size={11} /> Copy
            </button>
            <div style={{ maxHeight: 192, overflowY: 'auto', paddingRight: 60 }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {aiResult}
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label className="field-label">Ask AI</label>
          <textarea
            className="input"
            rows={3}
            style={{ resize: 'none' }}
            placeholder="Ask a question about this file..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="btn btn-primary btn-sm btn-full"
            style={{ marginTop: 8 }}
            onClick={ask}
            disabled={!question.trim() || activeAction !== null}
          >
            {activeAction === 'ASK' ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </div>

      {isProfessor && (
        <div style={{ marginTop: 26, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {!confirmDelete ? (
            <button className="btn btn-danger btn-sm btn-full" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={13} /> Delete this file
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', margin: '0 0 10px' }}>Delete this file?</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={confirmAndDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Confirm'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
