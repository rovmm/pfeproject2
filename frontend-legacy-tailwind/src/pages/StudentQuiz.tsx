import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi } from '../api/quiz.api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import type { QuizResponse, SubmitQuizAnswersRequest } from '../types'
import { ArrowLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react'

type Option = 'A' | 'B' | 'C' | 'D'

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function StudentQuiz() {
  const { id } = useParams<{ id: string }>()
  const sessionId = parseInt(id ?? '0')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [quiz, setQuiz]               = useState<QuizResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswersState]    = useState<Record<number, Option>>({})
  const [timeLeft, setTimeLeft]       = useState<number | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Refs keep the latest values accessible inside async callbacks and timer effects,
  // avoiding stale-closure bugs without expanding useCallback dependency arrays.
  const answersRef    = useRef<Record<number, Option>>({})
  const submittingRef = useRef(false)
  const quizRef       = useRef<QuizResponse | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const selectOption = (questionId: number, option: Option) => {
    const next = { ...answersRef.current, [questionId]: option }
    answersRef.current = next
    setAnswersState(next)
  }

  // ── Load quiz on mount ────────────────────────────────────────────────────
  useEffect(() => {
    quizApi.getQuiz(sessionId)
      .then(q => {
        setQuiz(q)
        quizRef.current = q
        if (q.timeLimitMinutes > 0) {
          setTimeLeft(q.timeLimitMinutes * 60)
        }
      })
      .catch(() => showToast('Impossible de charger le quiz', 'error'))
      .finally(() => setLoading(false))
  }, [sessionId])

  // ── Countdown — one setTimeout per tick to avoid drift ───────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  // ── Submit logic ─────────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (!quizRef.current || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setShowConfirm(false)

    const req: SubmitQuizAnswersRequest = {
      answers: quizRef.current.questions
        .filter(q => answersRef.current[q.id])
        .map(q => ({
          questionId: q.id,
          selectedOption: answersRef.current[q.id],
        })),
    }

    try {
      const result = await quizApi.submitAnswers(sessionId, req)
      // Persist so QuizResults can recover if user navigates back from StudentSession
      try { sessionStorage.setItem(`quiz_result_${sessionId}`, JSON.stringify(result)) } catch {}
      navigate(`/student/session/${sessionId}/quiz/results`, { state: { result } })
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la soumission', 'error')
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [sessionId, navigate, showToast])

  // ── Auto-submit when timer hits zero ─────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 0) doSubmit()
  }, [timeLeft, doSubmit])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-enter max-w-2xl mx-auto space-y-6">
        <Skeleton height="1.25rem" width="40%" />
        <Skeleton height="3.5rem" rounded="rounded-xl" />
        <Skeleton height="2rem" width="55%" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="3.5rem" rounded="rounded-xl" />
          ))}
        </div>
        <Skeleton height="3rem" rounded="rounded-xl" />
      </div>
    )
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <EmptyState
        title="Quiz introuvable"
        description="Ce quiz n'est pas disponible ou ne contient aucune question."
        action={{
          label: '← Retour à la session',
          onClick: () => navigate(`/student/session/${sessionId}`),
        }}
      />
    )
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const currentQuestion = quiz.questions[currentIndex]
  const isLast          = currentIndex === quiz.questions.length - 1
  const currentAnswer   = answers[currentQuestion.id]
  const answeredCount   = Object.keys(answers).length

  const OPTIONS: { label: Option; text: string }[] = [
    { label: 'A', text: currentQuestion.optionA },
    { label: 'B', text: currentQuestion.optionB },
    { label: 'C', text: currentQuestion.optionC },
    { label: 'D', text: currentQuestion.optionD },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter max-w-2xl mx-auto space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(`/student/session/${sessionId}`)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft size={15} />
        Retour à la session
      </button>

      {/* ── Top info bar ───────────────────────────────────────────────── */}
      <Card hover={false} padding="sm">
        <div className="flex items-center gap-4">
          {/* Quiz title */}
          <p className="text-sm font-semibold text-[var(--color-text)] flex-1 truncate min-w-0">
            {quiz.title}
          </p>

          {/* Progress */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <p className="text-xs text-[var(--color-muted)] whitespace-nowrap">
              Q&nbsp;{currentIndex + 1}&nbsp;/&nbsp;{quiz.questions.length}
            </p>
            <div className="w-32 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <div className={`flex items-center gap-1 text-sm font-mono font-bold flex-shrink-0 transition-colors ${
              timeLeft <= 60 ? 'text-red-500' : 'text-[var(--color-muted)]'
            }`}>
              <Clock size={13} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </Card>

      {/* ── Question ───────────────────────────────────────────────────── */}
      <div className="space-y-4 px-1">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white text-sm font-bold">
          Q{currentIndex + 1}
        </span>
        <p className="text-xl font-semibold text-[var(--color-text)] leading-relaxed">
          {currentQuestion.questionText}
        </p>
      </div>

      {/* ── Options ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {OPTIONS.map(({ label, text }) => {
          const selected = currentAnswer === label
          return (
            <button
              key={label}
              onClick={() => selectOption(currentQuestion.id, label)}
              disabled={submitting}
              className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all disabled:opacity-50 ${
                selected
                  ? 'border-2 border-primary-500 bg-primary-500/10'
                  : 'border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-bg)] hover:border-[var(--color-muted)]/40'
              }`}
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                selected
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-border)]/50 text-[var(--color-muted)]'
              }`}>
                {label}
              </span>
              <span className={`text-sm leading-snug ${
                selected ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text)]'
              }`}>
                {text}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Inline submit confirmation ──────────────────────────────────── */}
      {showConfirm && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Confirmer la soumission ?
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            Vous avez répondu à{' '}
            <strong className="text-[var(--color-text)]">{answeredCount}</strong>
            {' '}/{' '}{quiz.questions.length} questions.
            {answeredCount < quiz.questions.length && (
              <> Les questions sans réponse seront comptées comme incorrectes.</>
            )}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={submitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={doSubmit}
              isLoading={submitting}
              leftIcon={!submitting ? <CheckCircle size={13} /> : undefined}
              className="flex-1"
            >
              {submitting ? 'Soumission...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Bottom navigation ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border)] sticky bottom-0 bg-[var(--color-bg)] py-4 -mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={14} />}
          disabled={currentIndex === 0 || submitting}
          onClick={() => setCurrentIndex(i => i - 1)}
        >
          Précédent
        </Button>

        <p className="flex-1 text-center text-xs text-[var(--color-muted)]">
          {answeredCount} / {quiz.questions.length} répondues
        </p>

        {isLast ? (
          <Button
            variant="primary"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={!currentAnswer || submitting}
            onClick={() => setShowConfirm(true)}
            rightIcon={<CheckCircle size={14} />}
          >
            Soumettre
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={!currentAnswer || submitting}
            onClick={() => setCurrentIndex(i => i + 1)}
            rightIcon={<ChevronRight size={14} />}
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  )
}
