import { useEffect, useRef, useState } from 'react';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';
import FileIcon from '../../components/drive/FileIcon';
import FolderTree from '../../components/drive/FolderTree';
import FileDetailPanel from '../../components/drive/FileDetailPanel';
import FilePreviewModal from '../../components/drive/FilePreviewModal';
import UploadPanel from '../../components/drive/UploadPanel';
import { useToast } from '../../components/Toast';
import { driveApi } from '../../api/drive.api';
import type { DriveVisibility, FileResponse, FolderContentsResponse, FolderResponse } from '../../types/drive.types';
import {
  canPreview,
  formatFileSize,
  getVisibilityBadgeClass,
  getVisibilityLabel,
  isFavoriteFile,
  isFavoriteFolder,
  isFolderVisibleToStudent,
  toggleFavoriteFile,
  toggleFavoriteFolder,
} from '../../utils/driveUtils';

type View = 'browse' | 'favorites' | 'search';
type ViewMode = 'grid' | 'list';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfessorDrive() {
  useBreadcrumb(['CodrDrive']);
  const pushToast = useToast();

  const [rootFolders, setRootFolders] = useState<FolderResponse[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderResponse | null>(null);
  const [currentContents, setCurrentContents] = useState<FolderContentsResponse | null>(null);
  const [loadingContents, setLoadingContents] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);

  const [view, setView] = useState<View>('browse');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterQuery, setFilterQuery] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileResponse[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [favFolders, setFavFolders] = useState<FolderResponse[]>([]);
  const [favFiles, setFavFiles] = useState<FileResponse[]>([]);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderVisibility, setNewFolderVisibility] = useState<DriveVisibility>('STUDENTS');

  const [showNewSubfolder, setShowNewSubfolder] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [newSubfolderVisibility, setNewSubfolderVisibility] = useState<DriveVisibility>('STUDENTS');

  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // Bumped whenever a folder is created/renamed/deleted so the sidebar
  // FolderTree invalidates its per-node cached children instead of showing
  // stale (e.g. deleted) subfolders until a full page reload.
  const [treeRefreshToken, setTreeRefreshToken] = useState(0);

  // A folder gates everything inside it: even a file marked "Visible to
  // Students" stays hidden from students if this folder — or any ancestor
  // on the way down to it — isn't itself reachable by students.
  const blockingAncestors = selectedFolder
    ? [...(currentContents?.breadcrumb ?? []), selectedFolder].filter((f) => !isFolderVisibleToStudent(f))
    : [];

  useEffect(() => {
    loadRootFolders();
  }, []);

  useEffect(() => {
    if (view !== 'search') return;
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      driveApi
        .search(searchQuery.trim())
        .then(setSearchResults)
        .catch(() => pushToast('error', 'Search failed'))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, view]);

  function loadRootFolders() {
    driveApi
      .getMyFolders()
      .then((data) => setRootFolders(data.map((f) => ({ ...f, isFavorite: isFavoriteFolder(f.id) }))))
      .catch(() => pushToast('error', 'Could not load your CodrDrive'));
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
    setView('browse');
    loadRootFolders();
  }

  function refreshCurrentFolder() {
    if (selectedFolder) openFolder(selectedFolder);
    else loadRootFolders();
  }

  async function createRootFolder() {
    if (!newFolderName.trim()) return;
    try {
      const created = await driveApi.createFolder({ name: newFolderName.trim(), parentId: null, visibility: newFolderVisibility });
      setRootFolders((prev) => [{ ...created, isFavorite: false }, ...prev]);
      setNewFolderName('');
      setShowNewFolder(false);
      setTreeRefreshToken((t) => t + 1);
      pushToast('success', 'Folder created');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not create folder');
    }
  }

  async function createSubfolder() {
    if (!newSubfolderName.trim() || !selectedFolder) return;
    try {
      const created = await driveApi.createFolder({
        name: newSubfolderName.trim(),
        parentId: selectedFolder.id,
        visibility: newSubfolderVisibility,
      });
      setCurrentContents((prev) =>
        prev ? { ...prev, subfolders: [{ ...created, isFavorite: false }, ...prev.subfolders] } : prev,
      );
      setNewSubfolderName('');
      setShowNewSubfolder(false);
      setTreeRefreshToken((t) => t + 1);
      pushToast('success', 'Subfolder created');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not create subfolder');
    }
  }

  function renameFolder(folder: FolderResponse) {
    const name = window.prompt('Rename folder', folder.name);
    if (!name || !name.trim() || name.trim() === folder.name) return;
    driveApi
      .renameFolder(folder.id, name.trim())
      .then((updated) => {
        pushToast('success', 'Folder renamed');
        if (selectedFolder?.id === folder.id) setSelectedFolder(updated);
        setTreeRefreshToken((t) => t + 1);
        refreshCurrentFolder();
      })
      .catch((err) => pushToast('error', err.response?.data?.message || 'Could not rename folder'));
  }

  function changeFolderVisibility(folder: FolderResponse, visibility: DriveVisibility) {
    driveApi
      .updateFolderVisibility(folder.id, visibility)
      .then(() => {
        pushToast('success', 'Visibility updated');
        refreshCurrentFolder();
      })
      .catch((err) => pushToast('error', err.response?.data?.message || 'Could not update visibility'));
    setOpenMenu(null);
  }

  function deleteFolder(folder: FolderResponse) {
    if (!window.confirm(`Delete "${folder.name}" and everything inside it? This cannot be undone.`)) return;
    driveApi
      .deleteFolder(folder.id)
      .then(() => {
        pushToast('success', 'Folder deleted');
        setRootFolders((prev) => prev.filter((f) => f.id !== folder.id));
        setFavFolders((prev) => prev.filter((f) => f.id !== folder.id));
        setCurrentContents((prev) => (prev ? { ...prev, subfolders: prev.subfolders.filter((f) => f.id !== folder.id) } : prev));
        setTreeRefreshToken((t) => t + 1);
        if (selectedFolder?.id === folder.id) goToRoot();
        else if (view === 'browse') refreshCurrentFolder();
      })
      .catch((err) => pushToast('error', err.response?.data?.message || 'Could not delete folder'));
  }

  function deleteFile(file: FileResponse) {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    driveApi
      .deleteFile(file.id)
      .then(() => {
        pushToast('success', 'File deleted');
        setCurrentContents((prev) => (prev ? { ...prev, files: prev.files.filter((f) => f.id !== file.id) } : prev));
        setFavFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (selectedFile?.id === file.id) setSelectedFile(null);
      })
      .catch((err) => pushToast('error', err.response?.data?.message || 'Could not delete file'));
  }

  function toggleFavFolder(folder: FolderResponse) {
    const isFav = toggleFavoriteFolder(folder.id);
    const patch = (list: FolderResponse[]) => list.map((f) => (f.id === folder.id ? { ...f, isFavorite: isFav } : f));
    setRootFolders(patch);
    setCurrentContents((prev) => (prev ? { ...prev, subfolders: patch(prev.subfolders) } : prev));
    if (selectedFolder?.id === folder.id) setSelectedFolder({ ...selectedFolder, isFavorite: isFav });
  }

  function toggleFavFile(file: FileResponse) {
    const isFav = toggleFavoriteFile(file.id);
    setCurrentContents((prev) =>
      prev ? { ...prev, files: prev.files.map((f) => (f.id === file.id ? { ...f, isFavorite: isFav } : f)) } : prev,
    );
    if (selectedFile?.id === file.id) setSelectedFile({ ...selectedFile, isFavorite: isFav });
  }

  function openFavorites() {
    setView('favorites');
    setSelectedFile(null);
    driveApi
      .getMyFolders()
      .then((all) => {
        const favF = all.filter((f) => isFavoriteFolder(f.id)).map((f) => ({ ...f, isFavorite: true }));
        setFavFolders(favF);
      })
      .catch(() => pushToast('error', 'Could not load favorites'));
    driveApi
      .search('')
      .catch(() => [] as FileResponse[])
      .then((all) => {
        const list = Array.isArray(all) ? all : [];
        setFavFiles(list.filter((f) => isFavoriteFile(f.id)).map((f) => ({ ...f, isFavorite: true })));
      });
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

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    dragCounter.current = 0;
    if (!selectedFolder) {
      pushToast('error', 'Select a folder first');
      return;
    }
    if (e.dataTransfer.files.length > 0) {
      setShowUpload(true);
    }
  }

  const isRootView = !selectedFolder;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
      {/* Sidebar */}
      <aside style={{ width: 224, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 12 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>
          My CodrDrive
        </div>

        <button className="btn btn-secondary btn-sm btn-full" style={{ marginBottom: showNewFolder ? 10 : 12 }} onClick={() => setShowNewFolder((o) => !o)}>
          <Icon name="folder" size={13} /> New Folder
        </button>

        {showNewFolder && (
          <div style={{ marginBottom: 12, border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--surface-alt)' }}>
            <input
              className="input"
              style={{ marginBottom: 8, fontSize: 13, padding: '8px 10px' }}
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <select
              className="input"
              style={{ marginBottom: 8, fontSize: 12.5, padding: '8px 10px' }}
              value={newFolderVisibility}
              onChange={(e) => setNewFolderVisibility(e.target.value as DriveVisibility)}
            >
              <option value="STUDENTS">Visible to Students</option>
              <option value="PRIVATE">Professor Only</option>
              <option value="HIDDEN_UNTIL_DATE">Hidden Until Date</option>
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={createRootFolder}>
                Create
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setShowNewFolder(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <FolderTree
          folders={rootFolders}
          selectedFolderId={selectedFolder?.id ?? null}
          onSelectFolder={(f) => {
            setView('browse');
            openFolder(f);
          }}
          refreshToken={treeRefreshToken}
        />

        <div style={{ borderTop: '1px solid var(--surface-muted)', margin: '14px 0 8px' }} />

        <button
          className="btn btn-ghost btn-sm btn-full"
          style={{ justifyContent: 'flex-start', color: view === 'favorites' ? 'var(--navy)' : 'var(--ink-muted)' }}
          onClick={openFavorites}
        >
          <Icon name="star" size={14} /> Favorites
        </button>
        <button
          className="btn btn-ghost btn-sm btn-full"
          style={{ justifyContent: 'flex-start', color: view === 'search' ? 'var(--navy)' : 'var(--ink-muted)' }}
          onClick={() => {
            setView('search');
            setSelectedFile(null);
          }}
        >
          <Icon name="search" size={14} /> Search
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {view === 'browse' && (
          <>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 20px', background: 'var(--surface)', flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                <span style={{ cursor: 'pointer', color: isRootView ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: isRootView ? 600 : 400 }} onClick={goToRoot}>
                  My CodrDrive
                </span>
                {currentContents?.breadcrumb.map((b) => (
                  <span key={b.id}>
                    <span style={{ color: 'var(--divider-soft)', margin: '0 6px' }}>/</span>
                    <span style={{ cursor: 'pointer', color: 'var(--ink-muted)' }} onClick={() => openFolder(b)}>
                      {b.name}
                    </span>
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
                  {selectedFolder?.name ?? 'My CodrDrive'}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    style={{ width: 180, padding: '7px 11px', fontSize: 12.5 }}
                    placeholder="Filter..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--border)', color: viewMode === 'grid' ? 'var(--navy)' : 'var(--ink-muted)', padding: '7px 9px' }}
                    onClick={() => setViewMode('grid')}
                  >
                    <Icon name="grid" size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--border)', color: viewMode === 'list' ? 'var(--navy)' : 'var(--ink-muted)', padding: '7px 9px' }}
                    onClick={() => setViewMode('list')}
                  >
                    <Icon name="list" size={14} />
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    title={!selectedFolder ? 'Select a folder first' : undefined}
                    disabled={!selectedFolder}
                    onClick={() => setShowUpload(true)}
                  >
                    <Icon name="upload" size={13} /> Upload
                  </button>
                  {selectedFolder && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowNewSubfolder((o) => !o)}>
                      <Icon name="folder" size={13} /> New Subfolder
                    </button>
                  )}
                </div>
              </div>
            </div>

            {blockingAncestors.length > 0 && (
              <div
                style={{
                  margin: '12px 20px 0',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--error-bg)',
                  border: '1px solid var(--error-border)',
                  color: 'var(--error-strong)',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="alert-triangle" size={14} />
                <span>
                  {blockingAncestors.length === 1
                    ? `"${blockingAncestors[0].name}" is set to Professor Only`
                    : `${blockingAncestors.map((f) => `"${f.name}"`).join(', ')} are set to Professor Only`}
                  — students can't reach this folder, so files here won't appear to them even if marked "Visible to Students".
                </span>
              </div>
            )}

            <div
              style={{ flex: 1, overflowY: 'auto', padding: 20, position: 'relative' }}
              onClick={() => openMenu && setOpenMenu(null)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounter.current += 1;
                setDragOver(true);
              }}
              onDragLeave={() => {
                dragCounter.current -= 1;
                if (dragCounter.current <= 0) setDragOver(false);
              }}
              onDrop={onDrop}
            >
              {dragOver && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    border: '2px dashed var(--navy)',
                    background: 'rgba(30,58,138,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>
                    Drop files to upload
                  </span>
                </div>
              )}

              {showNewSubfolder && selectedFolder && (
                <div className="card card-pad" style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 10 }}>
                    New Subfolder
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      placeholder="Subfolder name"
                      value={newSubfolderName}
                      onChange={(e) => setNewSubfolderName(e.target.value)}
                      autoFocus
                    />
                    <select
                      className="input"
                      style={{ width: 190 }}
                      value={newSubfolderVisibility}
                      onChange={(e) => setNewSubfolderVisibility(e.target.value as DriveVisibility)}
                    >
                      <option value="STUDENTS">Visible to Students</option>
                      <option value="PRIVATE">Professor Only</option>
                      <option value="HIDDEN_UNTIL_DATE">Hidden Until Date</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={createSubfolder}>
                      Create
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }} onClick={() => setShowNewSubfolder(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isRootView && (
                <>
                  {rootFolders.length === 0 ? (
                    <EmptyState icon={<Icon name="folder" size={26} />} title="Your CodrDrive is empty" message="Create a folder to start organizing your course materials." />
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                        {rootFolders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            onOpen={() => openFolder(folder)}
                            onRename={() => renameFolder(folder)}
                            onDelete={() => deleteFolder(folder)}
                            onVisibility={(v) => changeFolderVisibility(folder, v)}
                            onFavorite={() => toggleFavFolder(folder)}
                          />
                        ))}
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 14 }}>Select a folder to browse its contents.</p>
                    </>
                  )}
                </>
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
                      {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                          {filteredSubfolders().map((folder) => (
                            <FolderCard
                              key={folder.id}
                              folder={folder}
                              openMenu={openMenu}
                              setOpenMenu={setOpenMenu}
                              onOpen={() => openFolder(folder)}
                              onRename={() => renameFolder(folder)}
                              onDelete={() => deleteFolder(folder)}
                              onVisibility={(v) => changeFolderVisibility(folder, v)}
                              onFavorite={() => toggleFavFolder(folder)}
                            />
                          ))}
                        </div>
                      ) : (
                        <FolderTable folders={filteredSubfolders()} onOpen={openFolder} onRename={renameFolder} onDelete={deleteFolder} />
                      )}
                    </div>
                  )}

                  {filteredFiles().length > 0 && (
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-placeholder)', marginBottom: 10 }}>
                        Files
                      </div>
                      {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                          {filteredFiles().map((file) => (
                            <FileCard
                              key={file.id}
                              file={file}
                              openMenu={openMenu}
                              setOpenMenu={setOpenMenu}
                              onOpen={() => setSelectedFile(file)}
                              onPreview={() => setPreviewFile(file)}
                              onDownload={() => driveApi.downloadFile(file.id, file.originalName).catch(() => pushToast('error', 'Could not download file'))}
                              onDelete={() => deleteFile(file)}
                              onFavorite={() => toggleFavFile(file)}
                            />
                          ))}
                        </div>
                      ) : (
                        <FileTable files={filteredFiles()} onOpen={setSelectedFile} onDownload={(f) => driveApi.downloadFile(f.id, f.originalName)} onDelete={deleteFile} />
                      )}
                    </div>
                  )}

                  {filteredSubfolders().length === 0 && filteredFiles().length === 0 && (
                    <EmptyState icon={<Icon name="folder-open" size={26} />} title="This folder is empty" message="Upload files or create subfolders to get started." />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {view === 'favorites' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', margin: '0 0 16px' }}>Favorites</h2>
            {favFolders.length === 0 && favFiles.length === 0 ? (
              <EmptyState icon={<Icon name="star" size={26} />} title="No favorites yet" message="Star folders or files to find them quickly here." />
            ) : (
              <>
                {favFolders.length > 0 && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-placeholder)', marginBottom: 10 }}>
                      Favorite Folders
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                      {favFolders.map((folder) => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                          onOpen={() => {
                            setView('browse');
                            openFolder(folder);
                          }}
                          onRename={() => renameFolder(folder)}
                          onDelete={() => deleteFolder(folder)}
                          onVisibility={(v) => changeFolderVisibility(folder, v)}
                          onFavorite={() => {
                            toggleFavoriteFolder(folder.id);
                            setFavFolders((prev) => prev.filter((f) => f.id !== folder.id));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {favFiles.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-placeholder)', marginBottom: 10 }}>
                      Favorite Files
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
                      {favFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                          onOpen={() => setSelectedFile(file)}
                          onPreview={() => setPreviewFile(file)}
                          onDownload={() => driveApi.downloadFile(file.id, file.originalName)}
                          onDelete={() => deleteFile(file)}
                          onFavorite={() => {
                            toggleFavoriteFile(file.id);
                            setFavFiles((prev) => prev.filter((f) => f.id !== file.id));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'search' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <input
              className="input"
              style={{ fontSize: 15, padding: '13px 16px', marginBottom: 18, maxWidth: 480 }}
              placeholder="Search files across your CodrDrive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {!searchQuery.trim() && (
              <EmptyState icon={<Icon name="search" size={26} />} title="Start typing to search" message="Search across every file in your CodrDrive by name." />
            )}
            {searchQuery.trim() && !searching && searchResults?.length === 0 && (
              <EmptyState icon={<Icon name="search" size={26} />} title="No files found" message="Try a different search term." />
            )}
            {searchResults && searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map((file) => (
                  <div
                    key={file.id}
                    className="card"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setSelectedFile(file)}
                  >
                    <FileIcon fileType={file.fileType} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{file.originalName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>{file.folderName}</div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatFileSize(file.fileSize)}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDate(file.uploadedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFile && (
        <FileDetailPanel
          file={selectedFile}
          isProfessor
          onClose={() => setSelectedFile(null)}
          onDelete={(id) => {
            setCurrentContents((prev) => (prev ? { ...prev, files: prev.files.filter((f) => f.id !== id) } : prev));
            setSelectedFile(null);
          }}
          onUpdate={(updated) => {
            setCurrentContents((prev) => (prev ? { ...prev, files: prev.files.map((f) => (f.id === updated.id ? updated : f)) } : prev));
            setSelectedFile(updated);
          }}
          onPreview={(f) => setPreviewFile(f)}
        />
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {showUpload && selectedFolder && (
        <UploadPanel
          folderId={selectedFolder.id}
          onClose={() => setShowUpload(false)}
          onUploadComplete={(files) => {
            setCurrentContents((prev) => (prev ? { ...prev, files: [...files.map((f) => ({ ...f, isFavorite: false })), ...prev.files] } : prev));
          }}
        />
      )}
    </div>
  );
}

// ─── Local presentational helpers ─────────────────────────────────────────

function ItemMenu({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex', padding: 2 }}
      >
        <Icon name="more-vertical" size={15} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-card)',
            minWidth: 170,
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '9px 14px',
        fontSize: 13,
        fontWeight: 600,
        color: danger ? 'var(--error-strong)' : 'var(--ink-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}

function FolderCard({
  folder,
  openMenu,
  setOpenMenu,
  onOpen,
  onRename,
  onDelete,
  onVisibility,
  onFavorite,
}: {
  folder: FolderResponse;
  openMenu: string | null;
  setOpenMenu: (k: string | null) => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onVisibility: (v: DriveVisibility) => void;
  onFavorite: () => void;
}) {
  const key = `folder-${folder.id}`;
  const [visOpen, setVisOpen] = useState(false);

  return (
    <div className="card card-hover" style={{ padding: 14, cursor: 'pointer', position: 'relative' }} onClick={onOpen} onDoubleClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--star-gold)' }}>
          <Icon name="folder" size={30} />
        </span>
        <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: folder.isFavorite ? 'var(--star-gold)' : 'var(--ink-faint)' }}
          >
            <Icon name={folder.isFavorite ? 'star-filled' : 'star'} size={14} />
          </button>
          <ItemMenu open={openMenu === key} onToggle={() => setOpenMenu(openMenu === key ? null : key)}>
            <MenuItem onClick={() => { setOpenMenu(null); onRename(); }}>Rename</MenuItem>
            <div style={{ position: 'relative' }}>
              <MenuItem onClick={() => setVisOpen((o) => !o)}>Change Visibility</MenuItem>
              {visOpen && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <MenuItem onClick={() => { setVisOpen(false); onVisibility('STUDENTS'); }}>Visible to Students</MenuItem>
                  <MenuItem onClick={() => { setVisOpen(false); onVisibility('PRIVATE'); }}>Professor Only</MenuItem>
                  <MenuItem onClick={() => { setVisOpen(false); onVisibility('HIDDEN_UNTIL_DATE'); }}>Hidden Until Date</MenuItem>
                </div>
              )}
            </div>
            <MenuItem danger onClick={() => { setOpenMenu(null); onDelete(); }}>
              <Icon name="trash" size={12} /> Delete
            </MenuItem>
          </ItemMenu>
        </div>
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

function FileCard({
  file,
  openMenu,
  setOpenMenu,
  onOpen,
  onPreview,
  onDownload,
  onDelete,
  onFavorite,
}: {
  file: FileResponse;
  openMenu: string | null;
  setOpenMenu: (k: string | null) => void;
  onOpen: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const key = `file-${file.id}`;
  return (
    <div
      className="card card-hover"
      style={{ padding: 14, cursor: 'pointer', position: 'relative' }}
      onClick={onOpen}
      onDoubleClick={() => (canPreview(file.fileType) ? onPreview() : onOpen())}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <FileIcon fileType={file.fileType} size="lg" />
        <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onFavorite}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 2, color: file.isFavorite ? 'var(--star-gold)' : 'var(--ink-faint)' }}
          >
            <Icon name={file.isFavorite ? 'star-filled' : 'star'} size={14} />
          </button>
          <ItemMenu open={openMenu === key} onToggle={() => setOpenMenu(openMenu === key ? null : key)}>
            {canPreview(file.fileType) && (
              <MenuItem onClick={() => { setOpenMenu(null); onPreview(); }}>
                <Icon name="eye" size={12} /> Preview
              </MenuItem>
            )}
            <MenuItem onClick={() => { setOpenMenu(null); onDownload(); }}>
              <Icon name="download" size={12} /> Download
            </MenuItem>
            <MenuItem danger onClick={() => { setOpenMenu(null); onDelete(); }}>
              <Icon name="trash" size={12} /> Delete
            </MenuItem>
          </ItemMenu>
        </div>
      </div>
      <div title={file.originalName} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {file.originalName}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2 }}>{formatFileSize(file.fileSize)}</div>
      <span className={getVisibilityBadgeClass(file.visibility)} style={{ marginTop: 8, display: 'inline-flex' }}>
        {getVisibilityLabel(file.visibility)}
      </span>
      {canPreview(file.fileType) && (
        <span className="file-preview-hint">
          <Icon name="eye" size={10} /> Preview
        </span>
      )}
    </div>
  );
}

function FolderTable({
  folders,
  onOpen,
  onRename,
  onDelete,
}: {
  folders: FolderResponse[];
  onOpen: (f: FolderResponse) => void;
  onRename: (f: FolderResponse) => void;
  onDelete: (f: FolderResponse) => void;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-placeholder)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Items</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Visibility</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Created</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}></th>
        </tr>
      </thead>
      <tbody>
        {folders.map((f) => (
          <tr key={f.id} style={{ borderTop: '1px solid var(--surface-muted)', cursor: 'pointer' }} onClick={() => onOpen(f)}>
            <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
              <span style={{ color: 'var(--star-gold)' }}><Icon name="folder" size={15} /></span> {f.name}
            </td>
            <td style={{ padding: '10px', fontSize: 12.5, color: 'var(--ink-muted)' }}>{f.subfolderCount + f.fileCount}</td>
            <td style={{ padding: '10px' }}><span className={getVisibilityBadgeClass(f.visibility)}>{getVisibilityLabel(f.visibility)}</span></td>
            <td style={{ padding: '10px', fontSize: 12.5, color: 'var(--ink-muted)' }}>{formatDate(f.createdAt)}</td>
            <td style={{ padding: '10px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12 }} onClick={() => onRename(f)}>Rename</span>
                <span style={{ cursor: 'pointer', color: 'var(--error-strong)', fontSize: 12 }} onClick={() => onDelete(f)}>Delete</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FileTable({
  files,
  onOpen,
  onDownload,
  onDelete,
}: {
  files: FileResponse[];
  onOpen: (f: FileResponse) => void;
  onDownload: (f: FileResponse) => void;
  onDelete: (f: FileResponse) => void;
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ textAlign: 'left', fontSize: 11.5, color: 'var(--ink-placeholder)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Name</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Type</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Size</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Visibility</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}>Date</th>
          <th style={{ padding: '8px 10px', fontWeight: 700 }}></th>
        </tr>
      </thead>
      <tbody>
        {files.map((f) => (
          <tr key={f.id} style={{ borderTop: '1px solid var(--surface-muted)', cursor: 'pointer' }} onClick={() => onOpen(f)}>
            <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
              <FileIcon fileType={f.fileType} size="sm" /> {f.originalName}
            </td>
            <td style={{ padding: '10px', fontSize: 12.5, color: 'var(--ink-muted)' }}>{f.fileType.toUpperCase()}</td>
            <td style={{ padding: '10px', fontSize: 12.5, color: 'var(--ink-muted)' }}>{formatFileSize(f.fileSize)}</td>
            <td style={{ padding: '10px' }}><span className={getVisibilityBadgeClass(f.visibility)}>{getVisibilityLabel(f.visibility)}</span></td>
            <td style={{ padding: '10px', fontSize: 12.5, color: 'var(--ink-muted)' }}>{formatDate(f.uploadedAt)}</td>
            <td style={{ padding: '10px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 12 }} onClick={() => onDownload(f)}>Download</span>
                <span style={{ cursor: 'pointer', color: 'var(--error-strong)', fontSize: 12 }} onClick={() => onDelete(f)}>Delete</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
