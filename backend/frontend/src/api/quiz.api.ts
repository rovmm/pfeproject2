import api from './axios'
import type {
  CreateQuestionRequest,
  CreateQuizRequest,
  QuizResponse,
  QuizAttemptResponse,
  LeaderboardResponse,
  SubmitQuizAnswersRequest,
} from '../types'

export const quizApi = {
  // POST /api/sessions/{id}/quiz/create  (PROF)
  createQuiz: (sessionId: number, req: CreateQuizRequest) =>
    api
      .post<QuizResponse>(`/sessions/${sessionId}/quiz/create`, req)
      .then((r) => r.data),

  // POST /api/sessions/{id}/quiz/generate-from-pdf  (PROF, multipart)
  // Non-file params are sent as URL query params so Spring @RequestParam picks them up.
  generateFromPdf: (
    sessionId: number,
    file: File,
    numberOfQuestions: number,
    title: string,
    description?: string,
  ) => {
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      numberOfQuestions: String(numberOfQuestions),
      title,
    })
    if (description) params.append('description', description)

    return api
      .post<QuizResponse>(
        `/sessions/${sessionId}/quiz/generate-from-pdf?${params}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 90_000, // AI can take 15-30 s
        },
      )
      .then((r) => r.data)
  },

  // POST /api/sessions/{id}/quiz/generate-preview  (PROF, multipart)
  // Extracts the PDF and asks the AI for questions WITHOUT persisting anything,
  // so the professor can review/edit them in the quiz editor before saving.
  generatePreview: (sessionId: number, file: File, numberOfQuestions: number) => {
    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams({
      numberOfQuestions: String(numberOfQuestions),
    })

    return api
      .post<CreateQuestionRequest[]>(
        `/sessions/${sessionId}/quiz/generate-preview?${params}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 90_000, // AI can take 15-30 s
        },
      )
      .then((r) => r.data)
  },

  // GET /api/sessions/{id}/quiz  (authenticated — prof gets correct answers, student does not)
  getQuiz: (sessionId: number) =>
    api.get<QuizResponse>(`/sessions/${sessionId}/quiz`).then((r) => r.data),

  // POST /api/sessions/{id}/quiz/submit  (STUDENT)
  submitAnswers: (sessionId: number, req: SubmitQuizAnswersRequest) =>
    api
      .post<QuizAttemptResponse>(`/sessions/${sessionId}/quiz/submit`, req)
      .then((r) => r.data),

  // GET /api/sessions/{id}/quiz/leaderboard  (authenticated)
  getLeaderboard: (sessionId: number) =>
    api
      .get<LeaderboardResponse>(`/sessions/${sessionId}/quiz/leaderboard`)
      .then((r) => r.data),

  // GET /api/sessions/{id}/quiz/attempts  (PROF)
  getAttempts: (sessionId: number) =>
    api
      .get<QuizAttemptResponse[]>(`/sessions/${sessionId}/quiz/attempts`)
      .then((r) => r.data),
}
