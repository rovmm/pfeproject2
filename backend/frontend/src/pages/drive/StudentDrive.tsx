import { useEffect, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import FileIcon from '../../components/drive/FileIcon';
import FileDetailPanel from '../../components/drive/FileDetailPanel';
import FilePreviewModal from '../../components/drive/FilePreviewModal';
import { useToast } from '../../components/Toast';
import { driveApi } from '../../api/drive.api';
import { sessionApi } from '../../api/session.api';
import type { FileResponse, FolderContentsResponse, FolderResponse } from '../../types/drive.types';
import {
  canPreview,
  formatFileSize,
  getVisibilityBadgeClass,
  getVisibilityLabel,
  isFavoriteFile,
  isFavoriteFolder,
  toggleFavoriteFile,
  toggleFavoriteFolder,
} from '../../utils/driveUtils';

type Professor = { id: number; name: string };

export default function StudentDrive() {
  useBreadcrumb(['CodrDrive']);
  const pushToast = useToast();

  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [rootFolders, setRootFolders] = useState<FolderResponse[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderResponse | null>(null);
  const [currentContents, setCurrentContents] = useState<FolderContentsResponse | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    sessionApi
      .getMyStudentSessions()
      .then((sessions) => {
        const map = new Map<number, string>();
        sessions.forEach((s) => map.set(s.profId, s.profName));
        setProfessors(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
      })
      .catch(() => pushToast('error', 'Could not load your professors'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectProfessor(profId: number) {
    setSelectedProfId(profId);
    setSelectedFolder(null);
    setCurrentContents(null);
    setSelectedFile(null);
    setLoadingRoot(true);
    driveApi
      .getStudentView(profId)
      .then((data) => setRootFolders(data.map((f) => ({ ...f, isFavorite: isFavoriteFolder(f.id) }))))
      .catch(() => pushToast('error', 'Could not load shared materials'))
      .finally(() => setLoadingRoot(false));
  }

  function openFolder(folder: FolderResponse) {
    setSelectedFile(null);
    setLoadingContents(true);
    driveApi
      .getFolderContents(folder.id)
      .then((res) => {
        setSelectedFolder({ ...res.folder, isFavorite: isFavoriteFolder(res.folder.id) });
        setCurrentContents({
          ...res,
          subfolders: res.subfolders.map((f) => ({ ...f, isFavorite: isFavoriteFolder(f.id) })),
          files: res.files.map((f) => ({ ...f, isFavorite: isFavoriteFile(f.id) })),
        });
      })
      .catch(() => pushToast('error', 'Could not open folder'))
      .finally(() => setLoadingContents(false));
  }

  function goToRoot() {
    setSelectedFolder(null);
    setCurrentContents(null);
    setSelectedFile(null);
  }

  function toggleFavFolder(folder: FolderResponse) {
    const isFav = toggleFavoriteFolder(folder.id);
    const patch = (list: FolderResponse[]) => list.map((f) => (f.id === folder.id ? { ...f, isFavorite: isFav } : f));
    setRootFolders(patch);
    setCurrentContents((prev) => (prev ? { ...prev, subfolders: patch(prev.subfolders) } : prev));
  }

  function toggleFavFile(file: FileResponse) {
    const isFav = toggleFavoriteFile(file.id);
    setCurrentContents((prev) =>
      prev ? { ...prev, files: prev.files.map((f) => (f.id === file.id ? { ...f, isFavorite: isFav } : f)) } : prev,
    );
    if (selectedFile?.id === file.id) setSelectedFile({ ...selectedFile, isFavorite: isFav });
  }

  function filteredSubfolders(): FolderResponse[] {
    if (!currentContents) return [];
    if (!filterQuery.trim()) return currentContents.subfolders;
    const q = filterQuery.trim().toLowerCase();
    return currentContents.subfolders.filter((f) => f.name.toLowerCase().includes(q));
  }

  function filteredFiles(): FileResponse[] {
    if (!currentContents) return [];
    if (!filterQuery.trim()) return currentContents.files;
    const q = filterQuery.trim().toLowerCase();
    return currentContents.files.filter((f) => f.originalName.toLowerCase().includes(q));
  }

  const isRootView = !selectedFolder;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 20px', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 10 }}>Select a professor:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {professors.map((p) => (
              <button
                key={p.id}
                className="btn btn-sm"
                style={
                  selectedProfId === p.id
                    ? { background: 'var(--brand-gradient)', color: '#fff', boxShadow: 'var(--shadow-btn)' }
                    : { background: 'var(--surface-alt)', color: 'var(--ink-secondary)', border: '1px solid var(--border)' }
                }
                onClick={() => selectProfessor(p.id)}
              >
                {p.name}
              </button>
            ))}
            {professors.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>No professors yet — join a session first.</span>}
          </div>
        </div>

        {selectedProfId === null && (
          <div style={{ flex: 1, padding: 20 }}>
            <EmptyState icon={<Icon name="folder" size={26} />} title="Select a professor" message="Choose a professor above to browse their shared materials." />
          </div>
        )}

        {selectedProfId !== null && (
          <>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 20px', background: 'var(--surface)', flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                <span style={{ cursor: 'pointer', color: isRootView ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: isRootView ? 600 : 400 }} onClick={goToRoot}>
                  Shared CodrDrive
                </span>
                {currentContents?.breadcrumb.map((b) => (
                  <span key={b.id}>
                    <span style={{ color: 'var(--divider-soft)', margin: '0 6px' }}>/</span>
                    <span style={{ cursor: 'pointer', color: 'var(--ink-muted)' }} onClick={() => openFolder(b)}>{b.name}</span>
                  </span>
                ))}
                {selectedFolder && (
                  <span>
                    <span style={{ color: 'var(--divider-soft)', margin: '0 6px' }}>/</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{selectedFolder.name}</span>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                  {selectedFolder?.name ?? 'Shared CodrDrive'}
                </span>
                <input
                  className="input"
                  style={{ marginLeft: 'auto', width: 180, padding: '7px 11px', fontSize: 12.5 }}
                  placeholder="Filter..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {isRootView && loadingRoot && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {isRootView && !loadingRoot && rootFolders.length === 0 && (
                <EmptyState icon={<Icon name="folder-open" size={26} />} title="No materials shared yet" message="This professor hasn't shared any folders with students yet." />
              )}

              {isRootView && !loadingRoot && rootFolders.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                  {rootFolders.map((folder) => (
                    <StudentFolderCard key={folder.id} folder={folder} onOpen={() => openFolder(folder)} onFavorite={() => toggleFavFolder(folder)} />
                  ))}
                </div>
              )}

              {!isRootView && loadingContents && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {!isRootView && !loadingContents && currentContents && (
                <>
                  {filteredSubfolders().length > 0 && (
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-placeholder)', marginBottom: 10 }}>
                        Folders
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                        {filteredSubfolders().map((folder) => (
                          <StudentFolderCard key={folder.id} folder={folder} onOpen={() => openFolder(folder)} onFavorite={() => toggleFavFolder(folder)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredFiles().length > 0 && (
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-placeholder)', marginBottom: 10 }}>
                        Files
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                        {filteredFiles().map((file) => (
                          <StudentFileCard
                            key={file.id}
                            file={file}
                            onOpen={() => setSelectedFile(file)}
                            onPreview={() => setPreviewFile(file)}
                            onDownload={() => driveApi.downloadFile(file.id, file.originalName).catch(() => pushToast('error', 'Could not download file'))}
                            onFavorite={() => toggleFavFile(file)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredSubfolders().length === 0 && filteredFiles().length === 0 && (
                    <EmptyState icon={<Icon name="folder-open" size={26} />} title="This folder is empty" message="Nothing has been shared here yet." />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {selectedFile && (
        <FileDetailPanel
          file={selectedFile}
          isProfessor={false}
          onClose={() => setSelectedFile(null)}
          onDelete={() => setSelectedFile(null)}
          onUpdate={() => {}}
          onPreview={(f) => setPreviewFile(f)}
        />
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

function StudentFolderCard({ folder, onOpen, onFavorite }: { folder: FolderResponse; onOpen: () => void; onFavorite: () => void }) {
  return (
    <div className="card card-hover" style={{ padding: 14, cursor: 'pointer', position: 'relative' }} onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--star-gold)' }}>
          <Icon name="folder" size={30} />
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: folder.isFavorite ? 'var(--star-gold)' : 'var(--ink-faint)' }}
        >
          <Icon name={folder.isFavorite ? 'star-filled' : 'star'} size={14} />
        </button>
      </div>
      <div title={folder.name} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {folder.name}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>
        {folder.subfolderCount + folder.fileCount} item{folder.subfolderCount + folder.fileCount === 1 ? '' : 's'}
      </div>
      <span className={getVisibilityBadgeClass(folder.visibility)} style={{ marginTop: 8, display: 'inline-flex' }}>
        {getVisibilityLabel(folder.visibility)}
      </span>
    </div>
  );
}

function StudentFileCard({
  file,
  onOpen,
  onPreview,
  onDownload,
  onFavorite,
}: {
  file: FileResponse;
  onOpen: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onFavorite: () => void;
}) {
  return (
    <div
      className="card card-hover"
      style={{ padding: 14, cursor: 'pointer', position: 'relative' }}
      onClick={onOpen}
      onDoubleClick={() => (canPreview(file.fileType) ? onPreview() : onOpen())}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <FileIcon fileType={file.fileType} size="lg" />
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: file.isFavorite ? 'var(--star-gold)' : 'var(--ink-faint)' }}
          >
            <Icon name={file.isFavorite ? 'star-filled' : 'star'} size={14} />
          </button>
          {file.allowDownload && (
            <button onClick={onDownload} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: 'var(--ink-faint)' }}>
              <Icon name="download" size={14} />
            </button>
          )}
        </div>
      </div>
      <div title={file.originalName} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {file.originalName}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>{formatFileSize(file.fileSize)}</div>
      {canPreview(file.fileType) && (
        <span className="file-preview-hint">
          <Icon name="eye" size={10} /> Preview
        </span>
      )}
    </div>
  );
}
