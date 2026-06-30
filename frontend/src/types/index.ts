// ─── Auth ─────────────────────────────────────────────────
export type Role = 'ADMIN' | 'PROF' | 'STUDENT'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  role: Role
}

export interface AuthResponse {
  token: string
  id: number
  fullName: string
  email: string
  role: Role
  plan?: string
}

export interface UserResponse {
  id: number
  fullName: string
  email: string
  role: Role
  plan?: string
}

export interface UpdateUserRequest {
  fullName?: string
  email?: string
  password?: string
}

// ─── Sessions ─────────────────────────────────────────────
export type SessionStatus = 'OPEN' | 'CLOSED'
export type SessionType   = 'CODE' | 'QUIZ'

export interface SessionResponse {
  id: number
  title: string
  joinCode: string
  status: SessionStatus
  profName: string
  studentCount: number
  createdAt: string
  language: Language
  exercisePrompt: string
  filiere?: string
  sessionType: SessionType
  hasQuiz: boolean
}

export interface CreateSessionRequest {
  title: string
  language?: Language
  exercisePrompt?: string
  filiere?: string
  sessionType?: SessionType
}

export interface DuplicateSessionRequest {
  title?: string
  filiere?: string
}

export interface SubmitCodeRequest {
  code: string
  language?: string
  stdin?: string
}

export interface StudentSubmissionResponse {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  code: string
  stdout: string | null
  stderr: string | null
  exitCode: number
  executionTimeMs: number
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'PENDING'
  submittedAt: string
}

// ─── Code Execution ───────────────────────────────────────
export type Language = 'python' | 'javascript' | 'java' | 'cpp' | 'php' | 'typescript'

export const LANGUAGES: { value: Language; label: string; monacoLang: string }[] = [
  { value: 'python',     label: 'Python',     monacoLang: 'python'     },
  { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { value: 'typescript', label: 'TypeScript', monacoLang: 'typescript' },
  { value: 'java',       label: 'Java',       monacoLang: 'java'       },
  { value: 'cpp',        label: 'C++',        monacoLang: 'cpp'        },
  { value: 'php',        label: 'PHP',        monacoLang: 'php'        },
]

export const LANG_META: Record<Language, { icon: string; bg: string; text: string; border: string }> = {
  python:     { icon: '🐍', bg: 'bg-green-500/15',  text: 'text-green-500',  border: 'border-green-500/30'  },
  javascript: { icon: '🟨', bg: 'bg-yellow-500/15', text: 'text-yellow-500', border: 'border-yellow-500/30' },
  typescript: { icon: '🔷', bg: 'bg-blue-500/15',   text: 'text-blue-500',   border: 'border-blue-500/30'   },
  java:       { icon: '☕', bg: 'bg-orange-500/15', text: 'text-orange-500', border: 'border-orange-500/30' },
  cpp:        { icon: '⚙️', bg: 'bg-gray-500/15',   text: 'text-gray-500',   border: 'border-gray-500/30'   },
  php:        { icon: '🐘', bg: 'bg-purple-500/15', text: 'text-purple-500', border: 'border-purple-500/30' },
}

export interface CodeExecuteRequest {
  code: string
  language: Language
  stdin?: string
}

export interface CodeExecuteResponse {
  success: boolean
  output: string
  error: string
  status: string
  language: string
  executionTimeMs: number
}

// ─── PDF ──────────────────────────────────────────────────
export interface PdfSummaryResponse {
  summary: string
  fileName: string
  pageCount: number
}

// ─── Quiz ─────────────────────────────────────────────────
export interface CreateQuestionRequest {
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
  position: number
}

export interface CreateQuizRequest {
  title: string
  description?: string
  timeLimitMinutes?: number
  questions: CreateQuestionRequest[]
}

export interface QuestionResponse {
  id: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  position: number
  correctOption?: string
}

export interface QuizResponse {
  id: number
  title: string
  description?: string
  timeLimitMinutes: number
  sessionId: number
  questions: QuestionResponse[]
  questionCount: number
}

export interface StudentAnswerRequest {
  questionId: number
  selectedOption: 'A' | 'B' | 'C' | 'D'
}

export interface SubmitQuizAnswersRequest {
  answers: StudentAnswerRequest[]
}

export interface StudentAnswerResult {
  questionId: number
  questionText: string
  selectedOption: string
  correctOption: string
  isCorrect: boolean
}

export interface QuizAttemptResponse {
  id: number
  studentId: number
  studentName: string
  studentEmail: string
  score: number
  totalQuestions: number
  percentage: number
  answers: StudentAnswerResult[]
  completedAt: string
}

export interface LeaderboardEntry {
  rank: number
  studentName: string
  studentEmail: string
  score: number
  totalQuestions: number
  percentage: number
  completedAt: string
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  totalStudents: number
  completedCount: number
}

// ─── UI ───────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}
