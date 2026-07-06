import type { SessionResponse } from '../types'

export type SessionType = 'code' | 'quiz'
export type SessionStatus = 'open' | 'closed'

export function toBackendLanguage(display: string): string {
  const first = display.split(' ')[0].toLowerCase()
  if (first === 'c++') return 'cpp'
  return first
}

export function toProfessorDisplay(s: SessionResponse) {
  return {
    id: String(s.id),
    type: (s.sessionType === 'QUIZ' ? 'quiz' : 'code') as SessionType,
    title: s.title,
    filiere: s.filiere ?? '',
    language: s.language?.toUpperCase(),
    joinCode: s.joinCode,
    studentsJoined: s.studentCount,
    status: (s.status === 'OPEN' ? 'open' : 'closed') as SessionStatus,
  }
}

export function toDisplaySession(s: SessionResponse) {
  return {
    id: String(s.id),
    type: (s.sessionType === 'QUIZ' ? 'quiz' : 'code') as SessionType,
    title: s.title,
    professor: s.profName,
    when: new Date(s.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: (s.status === 'OPEN' ? 'open' : 'closed') as SessionStatus,
    language: s.language?.toUpperCase(),
    joinCode: s.joinCode,
    studentCount: s.studentCount,
  }
}
