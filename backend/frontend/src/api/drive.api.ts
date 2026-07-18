import api from './axios'
import type {
  AiFileAction,
  CreateFolderRequest,
  DriveVisibility,
  FileResponse,
  FolderContentsResponse,
  FolderResponse,
  UpdateFileSettingsRequest,
} from '../types/drive.types'

export const driveApi = {
  // Folders
  createFolder: (req: CreateFolderRequest) =>
    api.post<FolderResponse>('/drive/folders', req).then((r) => r.data),

  getMyFolders: () =>
    api.get<FolderResponse[]>('/drive/folders/my').then((r) => r.data),

  getFolderContents: (folderId: number) =>
    api.get<FolderContentsResponse>(`/drive/folders/${folderId}/contents`).then((r) => r.data),

  renameFolder: (id: number, name: string) =>
    api.put<FolderResponse>(`/drive/folders/${id}/rename`, { name }).then((r) => r.data),

  updateFolderVisibility: (id: number, visibility: DriveVisibility, visibleFrom?: string | null) =>
    api.put<FolderResponse>(`/drive/folders/${id}/visibility`, { visibility, visibleFrom }).then((r) => r.data),

  deleteFolder: (id: number) => api.delete<void>(`/drive/folders/${id}`),

  // Files
  uploadFile: (
    folderId: number,
    file: File,
    visibility: DriveVisibility,
    allowDownload: boolean,
    onProgress: (pct: number) => void,
    visibleFrom?: string,
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folderId', String(folderId))
    form.append('visibility', visibility)
    form.append('allowDownload', String(allowDownload))
    if (visibleFrom) form.append('visibleFrom', visibleFrom)
    return api
      .post<FileResponse>('/drive/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) onProgress(Math.round((e.loaded * 100) / e.total))
        },
      })
      .then((r) => r.data)
  },

  updateFileSettings: (id: number, req: UpdateFileSettingsRequest) =>
    api.put<FileResponse>(`/drive/files/${id}/settings`, req).then((r) => r.data),

  deleteFile: (id: number) => api.delete<void>(`/drive/files/${id}`),

  downloadFile: (id: number, originalName: string) =>
    api.get(`/drive/files/${id}/download`, { responseType: 'blob' }).then((r) => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = originalName
      a.click()
      URL.revokeObjectURL(url)
    }),

  // Returns an object URL for the file's bytes — caller owns it and must
  // revoke it (URL.revokeObjectURL) once the preview is closed.
  previewFile: (id: number): Promise<string> =>
    api.get(`/drive/files/${id}/preview`, { responseType: 'blob' }).then((r) => URL.createObjectURL(r.data)),

  processWithAi: (id: number, action: AiFileAction) =>
    api.post<{ result: string }>(`/drive/files/${id}/ai/${action}`).then((r) => r.data),

  askAboutFile: (id: number, question: string) =>
    api.post<{ result: string }>(`/drive/files/${id}/ai/ask`, { question }).then((r) => r.data),

  search: (q: string) => api.get<FileResponse[]>(`/drive/search?q=${encodeURIComponent(q)}`).then((r) => r.data),

  getStudentView: (profId: number) =>
    api.get<FolderResponse[]>(`/drive/student/view/${profId}`).then((r) => r.data),
}
