import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionApi } from '../api/session.api'
import { quizApi } from '../api/quiz.api'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import type {
  SessionResponse, StudentSubmissionResponse, Language,
  QuizAttemptResponse, LeaderboardResponse, QuizResponse,
} from '../types'
import { LANGUAGES, LANG_META } from '../types'
import {
  ArrowLeft, Copy, Check, Users, Clock,
  ChevronDown, ChevronUp, Loader2, BookOpen,
  AlertTriangle, XCircle, Brain, Plus,
} from 'lucide-react'

// ── Language badge ─────────────────────────────────────────────────────────
function LangBadge({ lang }: { lang: Language }) {
  const m = LANG_META[lang]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span>{m.icon}</span>
      {LANGUAGES.find(l => l.value === lang)?.label ?? lang}
    </span>
  )
}

// ── Submission status badge ────────────────────────────────────────────────
function SubmissionStatusBadge({ status }: { status: StudentSubmissionResponse['status'] }) {
  const config = {
    SUCCESS: { cls: 'bg-green-500/15 text-green-500 border-green-500/30',  label: 'Succès'     },
    ERROR:   { cls: 'bg-red-500/15   text-red-500   border-red-500/30',    label: 'Erreur'     },
    TIMEOUT: { cls: 'bg-amber-500/15 text-amber-500 border-amber-500/30',  label: 'Timeout'    },
    PENDING: { cls: 'bg-gray-500/15  text-gray-500  border-gray-500/30',   label: 'En attente' },
  }[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${config.cls}`}>
      {config.label}
    </span>
  )
}

// ── Submission card ────────────────────────────────────────────────────────
function SubmissionCard({ sub }: { sub: StudentSubmissionResponse }) {
  const [expanded, setExpanded] = useState(false)
  const initials = sub.studentName.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
  const codePreview = sub.code.split('\n').slice(0, 3).join('\n')

  return (
    <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-500">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)] truncate">{sub.studentName}</p>
            <p className="text-xs text-[var(--color-muted)] truncate">{sub.studentEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SubmissionStatusBadge status={sub.status} />
          <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Clock size={10} />
            {sub.executionTimeMs}ms
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono border ${
            sub.exitCode === 0
              ? 'bg-green-500/10 text-green-600 border-green-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            exit {sub.exitCode}
          </span>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-[var(--color-border)]">
        <pre className="px-3 py-2 text-xs font-mono text-[var(--color-text)] bg-[var(--color-bg)] overflow-x-auto whitespace-pre">
          {expanded ? sub.code : codePreview}
          {!expanded && sub.code.split('\n').length > 3 && (
            <span className="text-[var(--color-muted)]">{'\n'}...</span>
          )}
        </pre>
      </div>

      {(sub.code.split('\n').length > 3 || sub.stdout || sub.stderr) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary-500 hover:underline"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Réduire' : 'Voir le code complet + sortie'}
        </button>
      )}

      {expanded && (
        <div className="space-y-2">
          {sub.stdout && (
            <div>
              <p className="text-xs font-medium text-green-500 mb-1 uppercase tracking-wider">Sortie</p>
              <pre className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/20 text-xs font-mono text-green-600 overflow-x-auto whitespace-pre-wrap">
                {sub.stdout}
              </pre>
            </div>
          )}
          {sub.stderr && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1 uppercase tracking-wider">Erreur</p>
              <pre className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-xs font-mono text-red-500 overflow-x-auto whitespace-pre-wrap">
                {sub.stderr}
              </pre>
            </div>
          )}
          <p className="text-xs text-[var(--color-muted)]">
            Soumis le {new Date(sub.submittedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Quiz Tab Panel ─────────────────────────────────────────────────────────
type QuizTab = 'leaderboard' | 'results' | 'preview'

function QuizTabPanel({ sessionId, session }: { sessionId: number; session: SessionResponse }) {
  const [activeTab, setActiveTab] = useState<QuizTab>('leaderboard')

  const [leaderboard, setLeaderboard]     = useState<LeaderboardResponse | null>(null)
  const [lbLoading, setLbLoading]         = useState(true)
  const [lastLbUpdate, setLastLbUpdate]   = useState<Date | null>(null)
  const [lbSecondsAgo, setLbSecondsAgo]   = useState(0)
  const lbPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [attempts, setAttempts]           = useState<QuizAttemptResponse[]>([])
  const [attLoading, setAttLoading]       = useState(true)
  const attPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [expandedIds, setExpandedIds]     = useState<Set<number>>(new Set())

  const [quiz, setQuiz]                   = useState<QuizResponse | null>(null)
  const [quizLoading, setQuizLoading]     = useState(false)

  const fetchLeaderboard = () => {
    quizApi.getLeaderboard(sessionId)
      .then(data => { setLeaderboard(data); setLastLbUpdate(new Date()) })
      .catch(() => {})
      .finally(() => setLbLoading(false))
  }

  const fetchAttempts = () => {
    quizApi.getAttempts(sessionId)
      .then(data => setAttempts(data))
      .catch(() => {})
      .finally(() => setAttLoading(false))
  }

  useEffect(() => {
    fetchLeaderboard()
    fetchAttempts()
    if (session.status === 'OPEN') {
      lbPollRef.current  = setInterval(fetchLeaderboard, 5000)
      attPollRef.current = setInterval(fetchAttempts, 10000)
    }
    return () => {
      if (lbPollRef.current)  clearInterval(lbPollRef.current)
      if (attPollRef.current) clearInterval(attPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (session.status === 'CLOSED') {
      if (lbPollRef.current)  { clearInterval(lbPollRef.current);  lbPollRef.current  = null }
      if (attPollRef.current) { clearInterval(attPollRef.current); attPollRef.current = null }
    }
  }, [session.status])

  useEffect(() => {
    if (activeTab === 'preview' && !quiz && !quizLoading) {
      setQuizLoading(true)
      quizApi.getQuiz(sessionId).then(setQuiz).catch(() => {}).finally(() => setQuizLoading(false))
    }
  }, [activeTab])

  useEffect(() => {
    const t = setInterval(() => {
      if (lastLbUpdate) setLbSecondsAgo(Math.floor((Date.now() - lastLbUpdate.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [lastLbUpdate])

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const TABS: { key: QuizTab; label: string }[] = [
    { key: 'leaderboard', label: '🏆 Classement Live' },
    { key: 'results',     label: '📋 Résultats Détaillés' },
    { key: 'preview',     label: '👁 Aperçu Quiz' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center p-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Live Leaderboard ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <Card hover={false}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-2">
                {leaderboard ? (
                  <>
                    <p className="text-sm font-bold text-[var(--color-text)]">
                      {leaderboard.completedCount} / {leaderboard.totalStudents} étudiants ont terminé
                    </p>
                    {leaderboard.totalStudents > 0 && (
                      <div className="h-2 w-52 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${(leaderboard.completedCount / leaderboard.totalStudents) * 100}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-4 w-40 rounded skeleton-shimmer" />
                )}
              </div>
              <div className="flex items-center gap-3">
                {session.status === 'OPEN' && (
                  <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Live
                  </span>
                )}
                {lastLbUpdate && (
                  <p className="text-xs text-[var(--color-muted)]">Mis à jour il y a {lbSecondsAgo}s</p>
                )}
              </div>
            </div>
          </Card>

          {lbLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg skeleton-shimmer" />)}
            </div>
          ) : !leaderboard || leaderboard.entries.length === 0 ? (
            <Card hover={false}>
              <div className="text-center py-10">
                <p className="text-3xl mb-3">🏆</p>
                <p className="text-sm font-medium text-[var(--color-text)]">Aucun étudiant n'a encore terminé le quiz</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">Les résultats apparaîtront ici en temps réel</p>
              </div>
            </Card>
          ) : (
            <Card hover={false} padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Rang', 'Étudiant', 'Score', '%', 'Heure'].map((h, i) => (
                      <th key={h} className={`py-2.5 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider ${
                        i === 0 ? 'text-left' : i <= 1 ? 'text-left' : i === 4 ? 'text-right' : 'text-center'
                      }`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {leaderboard.entries.map(entry => (
                    <tr key={entry.rank} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="py-3 px-4 font-bold text-base">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-[var(--color-text)]">{entry.studentName}</p>
                        <p className="text-xs text-[var(--color-muted)]">{entry.studentEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-[var(--color-text)]">
                        {entry.score}/{entry.totalQuestions}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.percentage >= 80 ? 'bg-green-500/15 text-green-500' :
                          entry.percentage >= 60 ? 'bg-blue-500/15 text-blue-500' :
                          entry.percentage >= 40 ? 'bg-amber-500/15 text-amber-500' :
                          'bg-red-500/15 text-red-500'
                        }`}>
                          {Math.round(entry.percentage)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-[var(--color-muted)]">
                        {new Date(entry.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab 2: Detailed Results ── */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          {attLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl skeleton-shimmer" />)}
            </div>
          ) : attempts.length === 0 ? (
            <Card hover={false}>
              <div className="text-center py-10">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm font-medium text-[var(--color-text)]">Aucune tentative pour l'instant</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">Les résultats détaillés apparaîtront ici</p>
              </div>
            </Card>
          ) : (
            attempts.map(att => {
              const expanded = expandedIds.has(att.id)
              const initials = att.studentName.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)
              const pctCls = att.percentage >= 80 ? 'bg-green-500/15 text-green-500' :
                             att.percentage >= 60 ? 'bg-blue-500/15 text-blue-500' :
                             att.percentage >= 40 ? 'bg-amber-500/15 text-amber-500' :
                             'bg-red-500/15 text-red-500'
              return (
                <div key={att.id} className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-card)] hover:bg-[var(--color-bg)] transition-colors text-left"
                    onClick={() => toggleExpanded(att.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-500">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text)]">{att.studentName}</p>
                        <p className="text-xs text-[var(--color-muted)]">{att.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-[var(--color-text)]">{att.score}/{att.totalQuestions}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pctCls}`}>
                        {Math.round(att.percentage)}%
                      </span>
                      {expanded
                        ? <ChevronUp size={14} className="text-[var(--color-muted)]" />
                        : <ChevronDown size={14} className="text-[var(--color-muted)]" />
                      }
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-2 px-4 text-left text-[var(--color-muted)] font-semibold uppercase tracking-wider">Question</th>
                            <th className="py-2 px-4 text-center text-[var(--color-muted)] font-semibold uppercase tracking-wider">Réponse</th>
                            <th className="py-2 px-4 text-center text-[var(--color-muted)] font-semibold uppercase tracking-wider">Correcte</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {att.answers.map((ans, i) => (
                            <tr key={i} className="hover:bg-[var(--color-card)] transition-colors">
                              <td className="py-2.5 px-4 max-w-xs">
                                <p className="text-[var(--color-text)] line-clamp-2">{ans.questionText}</p>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                                  ans.isCorrect ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                                }`}>
                                  {ans.isCorrect ? '✓' : '✗'} {ans.selectedOption}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-green-500/15 text-green-500">
                                  ✓ {ans.correctOption}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-2 text-xs text-[var(--color-muted)]">
                        Terminé le {new Date(att.completedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Tab 3: Quiz Preview ── */}
      {activeTab === 'preview' && (
        <div className="space-y-3">
          {quizLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl skeleton-shimmer" />)}
            </div>
          ) : !quiz ? (
            <Card hover={false}>
              <div className="text-center py-10">
                <p className="text-sm text-[var(--color-muted)]">Impossible de charger le quiz</p>
              </div>
            </Card>
          ) : (
            quiz.questions.map((q, i) => (
              <div key={q.id} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-[var(--color-text)]">{q.questionText}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const isCorrect = q.correctOption === opt
                    const text = q[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']
                    return (
                      <div
                        key={opt}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                          isCorrect
                            ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 font-medium'
                            : 'bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-[var(--color-border)]/60 text-[var(--color-muted)]'
                        }`}>
                          {opt}
                        </span>
                        <span className="flex-1">{text}</span>
                        {isCorrect && <span className="text-green-500">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function ProfessorSession() {
  const { id } = useParams<{ id: string }>()
  const sessionId = parseInt(id ?? '0')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [session, setSession]               = useState<SessionResponse | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [submissions, setSubmissions]       = useState<StudentSubmissionResponse[]>([])
  const [subLoading, setSubLoading]         = useState(true)
  const [closing, setClosing]               = useState(false)
  const [confirmClose, setConfirmClose]     = useState(false)
  const [copiedCode, setCopiedCode]         = useState(false)
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo]         = useState(0)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    sessionApi.getById(sessionId)
      .then(setSession)
      .catch(() => showToast('Session introuvable', 'error'))
      .finally(() => setSessionLoading(false))
  }, [sessionId])

  const fetchSubmissions = () => {
    sessionApi.getSubmissions(sessionId)
      .then(data => { setSubmissions(data); setLastUpdated(new Date()) })
      .catch(() => {})
      .finally(() => setSubLoading(false))
  }

  // Only poll submissions for CODE sessions
  useEffect(() => {
    if (!session) return
    if ((session.sessionType ?? 'CODE') === 'QUIZ') { setSubLoading(false); return }
    fetchSubmissions()
    if (session.status === 'OPEN') {
      pollRef.current = setInterval(fetchSubmissions, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [session?.id, session?.status])

  useEffect(() => {
    const t = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [lastUpdated])

  const handleClose = async () => {
    setClosing(true)
    try {
      await sessionApi.close(sessionId)
      setSession(prev => prev ? { ...prev, status: 'CLOSED' } : prev)
      if (pollRef.current) clearInterval(pollRef.current)
      showToast('Session fermée avec succès', 'success')
      setConfirmClose(false)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la fermeture', 'error')
    } finally {
      setClosing(false)
    }
  }

  const copyCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.joinCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return 1
    if (a.status !== 'PENDING' && b.status === 'PENDING') return -1
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })

  if (sessionLoading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-8 w-48 rounded-lg skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg skeleton-shimmer" />)}
          </div>
          <div className="lg:col-span-3 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-lg skeleton-shimmer" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <XCircle size={40} className="text-[var(--color-border)]" />
        <p className="text-sm text-[var(--color-muted)]">Session introuvable</p>
        <button onClick={() => navigate('/professor/dashboard')} className="text-xs text-primary-500 hover:underline">
          Retour au dashboard
        </button>
      </div>
    )
  }

  const isQuiz = (session.sessionType ?? 'CODE') === 'QUIZ'

  return (
    <div className="space-y-5 page-enter">
      <button
        onClick={() => navigate('/professor/dashboard')}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft size={15} />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT COLUMN ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Session header */}
          <Card hover={false}>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-base font-bold text-[var(--color-text)] leading-tight">{session.title}</h1>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  session.status === 'OPEN'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-[var(--color-border)]/60 text-[var(--color-muted)]'
                }`}>
                  {session.status === 'OPEN' ? '● OUVERTE' : 'FERMÉE'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {session.filiere && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
                    {session.filiere}
                  </span>
                )}
                {isQuiz ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30">
                    <Brain size={10} />
                    Quiz
                  </span>
                ) : (
                  <LangBadge lang={session.language} />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                <Users size={12} />
                {session.studentCount} étudiant(s)
              </div>
            </div>
          </Card>

          {/* Join code */}
          <Card hover={false}>
            <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2">Code d'accès</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-widest text-primary-500">
                {session.joinCode}
              </span>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all"
                title="Copier le code"
              >
                {copiedCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </Card>

          {/* Exercise prompt — CODE only */}
          {!isQuiz && (
            <Card hover={false}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-primary-500" />
                <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Énoncé</p>
              </div>
              <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                {session.exercisePrompt || <span className="italic text-[var(--color-muted)]">Aucun énoncé</span>}
              </p>
            </Card>
          )}

          {/* Close session */}
          {session.status === 'OPEN' && (
            <Card hover={false}>
              {!confirmClose ? (
                <button
                  onClick={() => setConfirmClose(true)}
                  className="w-full py-2 text-sm font-semibold text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  Fermer la session
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                    <AlertTriangle size={15} className="text-amber-500" />
                    Confirmer la fermeture ?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmClose(false)}
                      className="flex-1 py-1.5 text-xs border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      className="flex-1 py-1.5 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      {closing ? <Loader2 size={12} className="animate-spin" /> : null}
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {isQuiz ? (
            !session.hasQuiz ? (
              /* No quiz created yet */
              <Card hover={false}>
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto">
                    <Brain size={28} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-text)]">Aucun quiz créé</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      Créez les questions manuellement ou générez-les depuis un PDF avec l'IA.
                    </p>
                  </div>
                  {session.status === 'OPEN' && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <button
                        onClick={() => navigate(`/professor/session/${sessionId}/quiz/create`)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Plus size={14} />
                        Créer manuellement
                      </button>
                      <button
                        onClick={() => navigate(`/professor/session/${sessionId}/quiz/create`)}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 border border-purple-500/40 text-purple-400 text-sm font-semibold rounded-xl hover:bg-purple-500/10 transition-all"
                      >
                        <Brain size={14} />
                        Générer depuis un PDF
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <QuizTabPanel sessionId={sessionId} session={session} />
            )
          ) : (
            /* CODE session: existing submissions view */
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">Soumissions étudiants</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
                    {submissions.length}
                  </span>
                  {session.status === 'OPEN' && (
                    <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                {lastUpdated && (
                  <p className="text-xs text-[var(--color-muted)]">Mis à jour il y a {secondsAgo}s</p>
                )}
              </div>

              {subLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-lg skeleton-shimmer" />)}
                </div>
              ) : sortedSubmissions.length === 0 ? (
                <Card hover={false}>
                  <div className="text-center py-12">
                    <Users size={36} className="mx-auto text-[var(--color-border)] mb-3" />
                    <p className="text-sm font-medium text-[var(--color-text)] mb-1">Aucune soumission pour l'instant</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Les étudiants apparaîtront ici lorsqu'ils soumettront leur code
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sortedSubmissions.map(sub => <SubmissionCard key={sub.id} sub={sub} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
