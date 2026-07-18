import api from './axios'
import type {
  SessionResponse,
  CreateSessionRequest,
  DuplicateSessionRequest,
  StudentSubmissionResponse,
  ParticipantPresenceResponse,
  UserResponse,
  SaveCodingHistoryRequest,
  CodingHistoryResponse,
} from '../types'

export const sessionApi = {
  create: (data: CreateSessionRequest) =>
    api.post<SessionResponse>('/sessions/create', data).then((r) => r.data),

  getMySessions: () =>
    api.get<SessionResponse[]>('/sessions/my').then((r) => r.data),

  getMyStudentSessions: () =>
    api.get<SessionResponse[]>('/sessions/my/student').then((r) => r.data),

  getById: (id: number) =>
    api.get<SessionResponse>(`/sessions/${id}`).then((r) => r.data),

  join: (code: string) =>
    api.post<SessionResponse>(`/sessions/join/${code}`).then((r) => r.data),

  close: (id: number) =>
    api.put<void>(`/sessions/${id}/close`).then((r) => r.data),

  delete: (id: number) =>
    api.delete<void>(`/sessions/${id}`).then((r) => r.data),

  submitCode: (sessionId: number, code: string, language: string, stdin?: string) =>
    api
      .post<StudentSubmissionResponse>(`/sessions/${sessionId}/submit`, { code, language, stdin })
      .then((r) => r.data),

  getSubmissions: (sessionId: number) =>
    api
      .get<StudentSubmissionResponse[]>(`/sessions/${sessionId}/submissions`)
      .then((r) => r.data),

  heartbeat: (sessionId: number) =>
    api.post<void>(`/sessions/${sessionId}/heartbeat`).then((r) => r.data),

  getPresence: (sessionId: number) =>
    api
      .get<ParticipantPresenceResponse[]>(`/sessions/${sessionId}/presence`)
      .then((r) => r.data),

  duplicateSession: (sessionId: number, req: DuplicateSessionRequest) =>
    api
      .post<SessionResponse>(`/sessions/${sessionId}/duplicate`, req)
      .then((r) => r.data),

  saveCodingHistory: (sessionId: number, req: SaveCodingHistoryRequest) =>
    api
      .post<void>(`/sessions/${sessionId}/history/save`, req)
      .then((r) => r.data),

  getCodingHistory: (sessionId: number) =>
    api
      .get<CodingHistoryResponse[]>(`/sessions/${sessionId}/history`)
      .then((r) => r.data),
}

export const adminApi = {
  getUsers: () =>
    api.get<UserResponse[]>('/users').then((r) => r.data),

  deleteUser: (id: number) =>
    api.delete<void>(`/users/${id}`).then((r) => r.data),
}
