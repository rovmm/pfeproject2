import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { driveApi } from '../../api/drive.api'
import type { FolderResponse } from '../../types/drive.types'

function FolderNode({
  folder,
  selectedFolderId,
  onSelectFolder,
  depth,
  refreshToken,
}: {
  folder: FolderResponse
  selectedFolderId: number | null
  onSelectFolder: (folder: FolderResponse) => void
  depth: number
  refreshToken?: number
}) {
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [children, setChildren] = useState<FolderResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const isActive = selectedFolderId === folder.id;
  const hasChildren = folder.subfolderCount > 0;

  function loadChildren() {
    setLoading(true);
    driveApi
      .getFolderContents(folder.id)
      .then((res) => {
        setChildren(res.subfolders);
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }

  // Invalidate the cached children whenever a folder/file is created, renamed
  // or deleted anywhere in the drive, so an expanded node doesn't keep showing
  // stale (e.g. deleted) subfolders.
  useEffect(() => {
    if (expanded) loadChildren();
    else setLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function toggle() {
    if (!hasChildren) return;
    if (!expanded && !loaded) loadChildren();
    setExpanded((e) => !e);
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 6 + depth * 14,
          paddingRight: 6,
          height: 34,
          borderRadius: 9,
          cursor: 'pointer',
          background: isActive ? 'var(--tint-indigo)' : 'transparent',
          color: isActive ? 'var(--navy)' : 'var(--ink-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--surface-alt)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          onClick={toggle}
          style={{
            width: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: hasChildren ? 'var(--ink-placeholder)' : 'transparent',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Icon name="chevron-right" size={12} />
        </span>
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--star-gold)' }}>
          <Icon name={expanded ? 'folder-open' : 'folder'} size={15} />
        </span>
        <span
          title={folder.name}
          onClick={() => onSelectFolder(folder)}
          style={{
            flex: 1,
            fontSize: 13.5,
            fontWeight: isActive ? 600 : 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {folder.name}
        </span>
      </div>
      {expanded && (
        <div>
          {loading && (
            <div style={{ paddingLeft: 6 + (depth + 1) * 14, fontSize: 12, color: 'var(--ink-faint)', padding: '4px 0' }}>
              Loading…
            </div>
          )}
          {!loading &&
            children.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                depth={depth + 1}
                refreshToken={refreshToken}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  depth = 0,
  refreshToken,
}: {
  folders: FolderResponse[]
  selectedFolderId: number | null
  onSelectFolder: (folder: FolderResponse) => void
  depth?: number
  refreshToken?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          depth={depth}
          refreshToken={refreshToken}
        />
      ))}
    </div>
  );
}
