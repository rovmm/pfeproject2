import { useRef, useState } from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import ToggleSwitch from '../ToggleSwitch';
import FileIcon from './FileIcon';
import { useToast } from '../Toast';
import { driveApi } from '../../api/drive.api';
import type { DriveVisibility, FileResponse } from '../../types/drive.types';
import { formatFileSize, getFileExtension } from '../../utils/driveUtils';

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

function keyOf(file: File, index: number): string {
  return `${index}-${file.name}-${file.size}`;
}

export default function UploadPanel({
  folderId,
  onClose,
  onUploadComplete,
}: {
  folderId: number;
  onClose: () => void;
  onUploadComplete: (files: FileResponse[]) => void;
}) {
  const pushToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<DriveVisibility>('STUDENTS');
  const [allowDownload, setAllowDownload] = useState(true);
  const [visibleFrom, setVisibleFrom] = useState('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Record<string, UploadStatus>>({});
  const [uploading, setUploading] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadAll() {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    const uploaded: FileResponse[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const key = keyOf(file, i);
      setStatus((s) => ({ ...s, [key]: 'uploading' }));
      try {
        const result = await driveApi.uploadFile(
          folderId,
          file,
          visibility,
          allowDownload,
          (pct) => setProgress((p) => ({ ...p, [key]: pct })),
          visibility === 'HIDDEN_UNTIL_DATE' ? visibleFrom : undefined,
        );
        setStatus((s) => ({ ...s, [key]: 'done' }));
        uploaded.push(result);
      } catch {
        setStatus((s) => ({ ...s, [key]: 'error' }));
      }
    }

    setUploading(false);
    if (uploaded.length > 0) {
      pushToast('success', `${uploaded.length} file(s) uploaded`);
      onUploadComplete(uploaded);
    }
    if (uploaded.length < files.length) {
      pushToast('error', 'Some files failed to upload');
    } else {
      onClose();
    }
  }

  return (
    <Modal title="Upload Files" onClose={onClose} width={520}>
      {files.length === 0 && (
        <div
          onClick={() => fileInput.current?.click()}
          style={{
            border: '2px dashed var(--border-dashed)',
            borderRadius: 18,
            padding: 36,
            textAlign: 'center',
            background: 'linear-gradient(180deg,var(--surface-alt),var(--tint-indigo-strong))',
            cursor: 'pointer',
          }}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--tint-indigo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              color: 'var(--navy)',
            }}
          >
            <Icon name="upload" size={24} />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink)' }}>
            Drop files here or click to select
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: '6px 0 0' }}>Multiple files supported</p>
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {files.map((file, i) => {
            const key = keyOf(file, i);
            const pct = progress[key] ?? 0;
            const st = status[key] ?? 'pending';
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  background: 'var(--surface-alt)',
                }}
              >
                <FileIcon fileType={getFileExtension(file.name)} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    title={file.name}
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{formatFileSize(file.size)}</div>
                  {st === 'uploading' && (
                    <div style={{ width: '100%', height: 4, background: 'var(--surface-muted)', borderRadius: 999, marginTop: 6 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--navy)', borderRadius: 999, transition: 'width 0.15s ease' }} />
                    </div>
                  )}
                </div>
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {st === 'uploading' && <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{pct}%</span>}
                  {st === 'done' && <Icon name="check" size={15} color="var(--success)" />}
                  {st === 'error' && <Icon name="x-circle" size={15} color="var(--error-strong)" />}
                  {st === 'pending' && (
                    <span onClick={() => removeFile(i)} style={{ cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex' }}>
                      <Icon name="x" size={15} />
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {!uploading && (
            <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', alignSelf: 'flex-start' }} onClick={() => fileInput.current?.click()}>
              + Add more files
            </button>
          )}
        </div>
      )}

      <label className="field-label">Visibility</label>
      <select
        className="input"
        style={{ marginBottom: 12 }}
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as DriveVisibility)}
        disabled={uploading}
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
            disabled={uploading}
          />
        </div>
      )}
      <ToggleSwitch label="Allow Download" checked={allowDownload} onChange={setAllowDownload} disabled={uploading} />

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={uploadAll} disabled={files.length === 0 || uploading}>
          {uploading ? 'Uploading…' : 'Upload All'}
        </button>
        <button className="btn btn-ghost btn-md" style={{ border: '1px solid var(--border)' }} onClick={onClose} disabled={uploading}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
