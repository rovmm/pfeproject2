import type { DriveVisibility, FolderResponse } from '../types/drive.types'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isCodeFile(ext: string): boolean {
  return ['cpp', 'c', 'java', 'py', 'js', 'ts', 'html', 'css', 'sql', 'json', 'txt'].includes(ext)
}

export function isPdfFile(ext: string): boolean {
  return ext === 'pdf'
}

export function isImageFile(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
}

export function getVisibilityLabel(v: DriveVisibility): string {
  if (v === 'STUDENTS') return 'Visible to Students'
  if (v === 'PRIVATE') return 'Professor Only'
  return 'Hidden Until Date'
}

/** Reuses the app's existing badge classes/tokens — no new colors introduced. */
export function getVisibilityBadgeClass(v: DriveVisibility): string {
  if (v === 'STUDENTS') return 'badge badge-success'
  if (v === 'PRIVATE') return 'badge badge-closed'
  return 'badge badge-timeout'
}

/**
 * Mirrors the backend's `isVisibleToStudent(DriveFolder)` check (DriveServiceImpl).
 * A folder gates every file/subfolder inside it: if the folder itself isn't
 * reachable by students, nothing inside it is either — regardless of each
 * item's own visibility setting.
 */
export function isFolderVisibleToStudent(folder: Pick<FolderResponse, 'visibility' | 'visibleFrom'>): boolean {
  if (folder.visibility === 'STUDENTS') return true
  if (folder.visibility === 'HIDDEN_UNTIL_DATE') {
    return !!folder.visibleFrom && new Date(folder.visibleFrom).getTime() <= Date.now()
  }
  return false
}

/** Whether the drive file preview modal knows how to render this extension in-app. */
export function canPreview(fileType: string): boolean {
  const ext = fileType.toLowerCase()
  return isPdfFile(ext) || isImageFile(ext) || isCodeFile(ext)
}

const MONACO_LANGUAGES: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  java: 'java',
  cpp: 'cpp',
  c: 'cpp',
  sql: 'sql',
  json: 'json',
  html: 'html',
  css: 'css',
  txt: 'plaintext',
}

export function getMonacoLanguage(fileType: string): string {
  return MONACO_LANGUAGES[fileType.toLowerCase()] ?? 'plaintext'
}

/** Colors reuse existing design tokens from styles/tokens.css. */
export function getFileColorVar(ext: string): string {
  if (isPdfFile(ext)) return 'var(--error-strong)'
  if (isCodeFile(ext)) return 'var(--blue-accent)'
  if (isImageFile(ext)) return 'var(--success)'
  if (['pptx', 'ppt'].includes(ext)) return 'var(--amber-strong)'
  if (['docx', 'doc'].includes(ext)) return 'var(--navy)'
  return 'var(--ink-muted)'
}

// ─── Favorites (client-only — no backend persistence exists for this yet) ──
const FAV_FOLDERS_KEY = 'ss_drive_fav_folders'
const FAV_FILES_KEY = 'ss_drive_fav_files'

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: number[]) {
  localStorage.setItem(key, JSON.stringify(ids))
}

export function isFavoriteFolder(id: number): boolean {
  return readIds(FAV_FOLDERS_KEY).includes(id)
}

export function isFavoriteFile(id: number): boolean {
  return readIds(FAV_FILES_KEY).includes(id)
}

export function toggleFavoriteFolder(id: number): boolean {
  const ids = readIds(FAV_FOLDERS_KEY)
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  writeIds(FAV_FOLDERS_KEY, next)
  return next.includes(id)
}

export function toggleFavoriteFile(id: number): boolean {
  const ids = readIds(FAV_FILES_KEY)
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  writeIds(FAV_FILES_KEY, next)
  return next.includes(id)
}
