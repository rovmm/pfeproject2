export type DriveVisibility = 'STUDENTS' | 'PRIVATE' | 'HIDDEN_UNTIL_DATE'

export interface FolderResponse {
  id: number
  name: string
  profId: number
  parentId: number | null
  visibility: DriveVisibility
  visibleFrom: string | null
  subfolderCount: number
  fileCount: number
  createdAt: string
  updatedAt: string
  isFavorite: boolean
}

export interface FileResponse {
  id: number
  originalName: string
  fileType: string
  fileSize: number
  folderId: number
  folderName: string
  profId: number
  profName: string
  visibility: DriveVisibility
  visibleFrom: string | null
  allowDownload: boolean
  uploadedAt: string
  isFavorite: boolean
  downloadUrl: string
}

export interface FolderContentsResponse {
  folder: FolderResponse
  subfolders: FolderResponse[]
  files: FileResponse[]
  breadcrumb: FolderResponse[]
}

export interface CreateFolderRequest {
  name: string
  parentId?: number | null
  visibility: DriveVisibility
  visibleFrom?: string | null
}

export interface UpdateFileSettingsRequest {
  name?: string
  visibility?: DriveVisibility
  visibleFrom?: string | null
  allowDownload?: boolean
}

export type AiFileAction =
  | 'SUMMARIZE'
  | 'GENERATE_QUIZ'
  | 'GENERATE_FLASHCARDS'
  | 'EXPLAIN'
  | 'KEY_CONCEPTS'
  | 'GENERATE_EXERCISE'
  | 'EXPLAIN_CODE'
  | 'DEBUG_CODE'
  | 'OPTIMIZE_CODE'
  | 'REVIEW_CODE'
