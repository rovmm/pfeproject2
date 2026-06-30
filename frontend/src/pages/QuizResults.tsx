import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizApi } from '../api/quiz.api'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import type { QuizAttemptResponse, LeaderboardResponse } from '../types'
import { ArrowLeft, CheckCircle, XCircle, Trophy } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────
function ringColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 60) return '#3b82f6'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

function scoreMessage(pct: number): string {
  if (pct >= 80) return 'Excellent ! 🎉'
  if (pct >= 60) return 'Bon travail ! 👍'
  if (pct >= 40) return 'Continuez à pratiquer 💪'
  return 'Révisez le cours 📚'
}

function scorePctClass(pct: number): string {
  if (pct >= 80) return 'bg-green-500/15 text-green-500'
  if (pct >= 60) return 'bg-blue-500/15 text-blue-500'
  if (pct >= 40) return 'bg-amber-500/15 text-amber-500'
  return 'bg-red-500/15 text-red-500'
}

// ── Component ──────────────────────────────────────────────────────────────
export function QuizResults() {
  const { id } = useParams<{ id: string }>()
  const sessionId = parseInt(id ?? '0')
  const navigate  = useNavigate()
  const location  = useLocation()
  const { currentUser } = useAuth()

  const [attempt, setAttempt]       = useState<QuizAttemptResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [lbLoading, setLbLoading]   = useState(true)

  useEffect(() => {
    // 1 — Try router state (navigated from StudentQuiz immediately after submit)
    const stateResult = (location.state as any)?.result as QuizAttemptResponse | undefined

    if (stateResult) {
      setAttempt(stateResult)
    } else {
      // 2 — Fallback: sessionStorage (navigated from "View My Results" in StudentSession)
      try {
        const raw = sessionStorage.getItem(`quiz_result_${sessionId}`)
        if (raw) {
          setAttempt(JSON.parse(raw))
        } else {
          navigate('/student/dashboard', { replace: true })
          return
        }
      } catch {
        navigate('/student/dashboard', { replace: true })
        return
      }
    }

    quizApi.getLeaderboard(sessionId)
      .then(setLeaderboard)
      .catch(() => {})
      .finally(() => setLbLoading(false))
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading (brief — attempt comes from state or storage synchronously) ──
  if (!attempt) {
    return (
      <div className="page-enter max-w-3xl mx-auto space-y-6">
        <Skeleton height="9rem" rounded="rounded-2xl" />
        <Skeleton height="6rem" rounded="rounded-xl" />
        <Skeleton height="6rem" rounded="rounded-xl" />
        <Skeleton height="10rem" rounded="rounded-xl" />
      </div>
    )
  }

  const pct   = attempt.percentage
  const color = ringColor(pct)

  return (
    <div className="page-enter max-w-3xl mx-auto space-y-8">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — Score card
      ═══════════════════════════════════════════════════════════════ */}
      <Card hover={false}>
        <div className="text-center py-6 space-y-4">

          {/* Circular progress ring */}
          <div className="flex justify-center">
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: '140px',
                height: '140px',
                background: `conic-gradient(${color} ${pct}%, var(--color-border) 0%)`,
              }}
            >
              <div
                className="absolute rounded-full bg-[var(--color-card)] flex items-center justify-center"
                style={{ width: '108px', height: '108px' }}
              >
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  {Math.round(pct)}%
                </p>
              </div>
            </div>
          </div>

          {/* Score */}
          <div>
            <p className="text-3xl font-bold text-[var(--color-text)] mt-2">
              {attempt.score} / {attempt.totalQuestions}
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">questions correctes</p>
          </div>

          {/* Message */}
          <p className="text-lg font-semibold text-[var(--color-text)]">
            {scoreMessage(pct)}
          </p>

          {/* Completion time */}
          <p className="text-xs text-[var(--color-muted)]">
            Terminé le{' '}
            {new Date(attempt.completedAt).toLocaleString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — Answer breakdown
      ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Vos réponses</h2>

        <div className="space-y-3">
          {attempt.answers.map((ans, i) => (
            <Card key={i} hover={false}>
              <div className="space-y-3">
                {/* Question text */}
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)] text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-[var(--color-text)] leading-snug">
                    {ans.questionText}
                  </p>
                </div>

                {/* Answer row */}
                <div className="flex items-center gap-4 flex-wrap pl-9">
                  {/* Student's answer */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted)]">Votre réponse :</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      ans.isCorrect
                        ? 'bg-green-500/15 text-green-500 border-green-500/30'
                        : 'bg-red-500/15 text-red-500 border-red-500/30'
                    }`}>
                      {ans.isCorrect ? '✓' : '✗'}&nbsp;{ans.selectedOption}
                    </span>
                  </div>

                  {/* Correct answer — always shown when wrong */}
                  {!ans.isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-muted)]">Bonne réponse :</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-green-500/15 text-green-500 border-green-500/30">
                        ✓&nbsp;{ans.correctOption}
                      </span>
                    </div>
                  )}

                  {/* Result icon */}
                  <div className="ml-auto">
                    {ans.isCorrect
                      ? <CheckCircle size={18} className="text-green-500" />
                      : <XCircle    size={18} className="text-red-500"   />
                    }
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Leaderboard
      ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-amber-500" />
          <h2 className="text-lg font-bold text-[var(--color-text)]">Classement</h2>
          {leaderboard && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
              {leaderboard.completedCount} / {leaderboard.totalStudents} étudiants
            </span>
          )}
        </div>

        {lbLoading ? (
          <Card hover={false} padding="none">
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height="2.75rem" rounded="rounded-lg" />)}
            </div>
          </Card>
        ) : !leaderboard || leaderboard.entries.length === 0 ? (
          <Card hover={false}>
            <div className="text-center py-8">
              <p className="text-sm text-[var(--color-muted)]">Le classement n'est pas encore disponible.</p>
            </div>
          </Card>
        ) : (
          <Card hover={false} padding="none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Rang', 'Étudiant', 'Score', '%', 'Heure'].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ${
                        i === 0 || i === 1 ? 'text-left' : i === 4 ? 'text-right' : 'text-center'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {leaderboard.entries.map(entry => {
                  const isMe = entry.studentEmail === currentUser?.email
                  return (
                    <tr
                      key={entry.rank}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-primary-500/10'
                          : 'hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      <td className={`py-3 px-4 font-bold text-base ${isMe ? 'border-l-4 border-primary-500' : ''}`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </td>
                      <td className="py-3 px-4">
                        <p className={`text-sm text-[var(--color-text)] ${isMe ? 'font-bold' : 'font-medium'}`}>
                          {entry.studentName}
                          {isMe && (
                            <span className="ml-2 text-xs font-normal text-primary-500">(vous)</span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">{entry.studentEmail}</p>
                      </td>
                      <td className={`py-3 px-4 text-center text-sm text-[var(--color-text)] ${isMe ? 'font-bold' : 'font-semibold'}`}>
                        {entry.score}/{entry.totalQuestions}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${scorePctClass(entry.percentage)}`}>
                          {Math.round(entry.percentage)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[var(--color-muted)]">
                        {new Date(entry.completedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* ── Bottom actions ────────────────────────────────────────────── */}
      <div className="pb-6">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={14} />}
          onClick={() => navigate(`/student/session/${sessionId}`)}
        >
          Retour à la session
        </Button>
      </div>
    </div>
  )
}
