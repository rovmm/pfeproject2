import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { sessionApi } from '../api/session.api'
import { quizApi } from '../api/quiz.api'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../hooks/useAuth'
import type {
  SessionResponse, Language, CodeExecuteResponse,
  StudentSubmissionResponse, QuizResponse, LeaderboardEntry,
} from '../types'
import { LANGUAGES, LANG_META } from '../types'
import { codeApi } from '../api/code.api'
import {
  ArrowLeft, Play, Send, Loader2, BookOpen,
  ChevronDown, Bot, CheckCircle, XCircle, Clock,
  AlertTriangle, Brain,
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

// ── Default starter code ───────────────────────────────────────────────────
const STARTERS: Record<Language, string> = {
  python:     `# Écrivez votre solution ici\n`,
  javascript: `// Écrivez votre solution ici\n`,
  typescript: `// Écrivez votre solution ici\n`,
  java:       `public class Main {\n    public static void main(String[] args) {\n        // Écrivez votre solution ici\n    }\n}`,
  cpp:        `#include <iostream>\nusing namespace std;\nint main() {\n    // Écrivez votre solution ici\n    return 0;\n}`,
  php:        `<?php\n// Écrivez votre solution ici\n`,
}

// ── Main component ─────────────────────────────────────────────────────────
export function StudentSession() {
  const { id } = useParams<{ id: string }>()
  const sessionId = parseInt(id ?? '0')
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { theme } = useTheme()
  const { currentUser } = useAuth()
  const editorRef = useRef<any>(null)

  // ── Shared state ────────────────────────────────────────────────────────
  const [session, setSession]               = useState<SessionResponse | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  // ── QUIZ-mode state ─────────────────────────────────────────────────────
  const [quizInfo, setQuizInfo]               = useState<QuizResponse | null>(null)
  const [quizDataLoading, setQuizDataLoading] = useState(false)
  const [myLeaderboardEntry, setMyEntry]      = useState<LeaderboardEntry | null>(null)

  // ── CODE-mode state ─────────────────────────────────────────────────────
  const [language, setLanguage]           = useState<Language>('python')
  const [code, setCode]                   = useState(STARTERS['python'])
  const [stdin, setStdin]                 = useState('')
  const [showStdin, setShowStdin]         = useState(false)
  const [langOpen, setLangOpen]           = useState(false)
  const [running, setRunning]             = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [runResult, setRunResult]         = useState<CodeExecuteResponse | null>(null)
  const [submitResult, setSubmitResult]   = useState<StudentSubmissionResponse | null>(null)
  const [aiAnalysis, setAiAnalysis]       = useState('')
  const [analyzingAi, setAnalyzingAi]     = useState(false)

  // ── Load session ────────────────────────────────────────────────────────
  useEffect(() => {
    sessionApi.getById(sessionId)
      .then(s => {
        setSession(s)
        // Only set language/code for CODE sessions
        if ((s.sessionType ?? 'CODE') !== 'QUIZ') {
          const lang = s.language as Language
          setLanguage(lang)
          setCode(STARTERS[lang] ?? STARTERS['python'])
        }
      })
      .catch(() => showToast('Session introuvable', 'error'))
      .finally(() => setSessionLoading(false))
  }, [sessionId])

  // ── Load quiz data (QUIZ sessions only) ─────────────────────────────────
  useEffect(() => {
    if (!session || (session.sessionType ?? 'CODE') !== 'QUIZ') return
    if (!session.hasQuiz) return

    setQuizDataLoading(true)
    Promise.all([
      quizApi.getQuiz(sessionId),
      quizApi.getLeaderboard(sessionId),
    ])
      .then(([quiz, lb]) => {
        setQuizInfo(quiz)
        const entry = lb.entries.find(e => e.studentEmail === currentUser?.email) ?? null
        setMyEntry(entry)
      })
      .catch(() => {})
      .finally(() => setQuizDataLoading(false))
  }, [session?.id])

  // ── CODE-mode handlers ───────────────────────────────────────────────────
  const handleLangChange = (lang: Language) => {
    setLanguage(lang)
    setCode(STARTERS[lang])
    setRunResult(null)
    setSubmitResult(null)
    setAiAnalysis('')
    setLangOpen(false)
  }

  const handleRun = async () => {
    if (!code.trim()) return
    setRunning(true)
    setRunResult(null)
    setSubmitResult(null)
    setAiAnalysis('')
    try {
      const res = await codeApi.execute({ code, language, stdin: stdin || undefined })
      setRunResult(res)
    } catch (err: any) {
      setRunResult({
        success: false, output: '', error: err.response?.data?.message || 'Erreur réseau',
        status: 'ERROR', language, executionTimeMs: 0,
      })
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim() || !session) return
    setSubmitting(true)
    setRunResult(null)
    setSubmitResult(null)
    setAiAnalysis('')
    try {
      const res = await sessionApi.submitCode(sessionId, code, language, stdin || undefined)
      setSubmitResult(res)
      showToast('Code soumis avec succès !', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la soumission', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAiAnalyze = async () => {
    const result = runResult ?? (submitResult ? {
      success: submitResult.status === 'SUCCESS',
      output: submitResult.stdout ?? '',
      error: submitResult.stderr ?? '',
      status: submitResult.status,
      language,
      executionTimeMs: submitResult.executionTimeMs,
    } : null)
    if (!result) return
    setAnalyzingAi(true)
    setAiAnalysis('')
    try {
      const resp = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ss_token')}`,
        },
        body: JSON.stringify({ code, language, error: result.error, output: result.output }),
      })
      const data = await resp.json()
      setAiAnalysis(data.analysis || data.message || JSON.stringify(data))
    } catch {
      setAiAnalysis("Impossible de contacter l'IA.")
    } finally {
      setAnalyzingAi(false)
    }
  }

  // ── Loading skeleton (shared) ────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="h-6 w-32 rounded skeleton-shimmer" />
        <div className="h-28 rounded-lg skeleton-shimmer" />
        <div className="h-64 rounded-lg skeleton-shimmer" />
      </div>
    )
  }

  // ── Not found (shared) ───────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <XCircle size={40} className="text-[var(--color-border)]" />
        <p className="text-sm text-[var(--color-muted)]">Session introuvable</p>
        <button onClick={() => navigate('/student/dashboard')} className="text-xs text-primary-500 hover:underline">
          Retour au dashboard
        </button>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // QUIZ MODE
  // ════════════════════════════════════════════════════════════════════
  if ((session.sessionType ?? 'CODE') === 'QUIZ') {
    const sessionClosed = session.status === 'CLOSED'

    return (
      <div className="space-y-4 page-enter max-w-2xl">
        {/* Back */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </button>

        {/* Closed banner — only if they haven't submitted */}
        {sessionClosed && !quizDataLoading && !myLeaderboardEntry && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
            <AlertTriangle size={15} />
            Cette session est fermée — vous ne pouvez plus soumettre ce quiz.
          </div>
        )}

        {/* Session header */}
        <Card hover={false} className="border-purple-500/20 bg-purple-500/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Brain size={16} className="text-purple-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Session Quiz
                </span>
                {session.filiere && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
                    {session.filiere}
                  </span>
                )}
              </div>
              <h1 className="text-sm font-bold text-[var(--color-text)]">{session.title}</h1>
            </div>
          </div>
        </Card>

        {/* No quiz created yet */}
        {!session.hasQuiz && (
          <Card hover={false}>
            <div className="text-center py-10">
              <p className="text-3xl mb-3">🧠</p>
              <p className="text-sm font-medium text-[var(--color-text)]">
                Le quiz n'est pas encore disponible
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Le professeur n'a pas encore créé les questions.
              </p>
            </div>
          </Card>
        )}

        {/* Quiz data loading skeleton */}
        {session.hasQuiz && quizDataLoading && (
          <Card hover={false}>
            <div className="space-y-3">
              <div className="h-5 w-48 skeleton-shimmer rounded-md" />
              <div className="h-4 w-32 skeleton-shimmer rounded-md" />
              <div className="flex gap-4 pt-1">
                <div className="h-4 w-24 skeleton-shimmer rounded-md" />
                <div className="h-4 w-24 skeleton-shimmer rounded-md" />
              </div>
              <div className="h-12 skeleton-shimmer rounded-xl mt-2" />
            </div>
          </Card>
        )}

        {/* Quiz info + action — shown once data has loaded */}
        {session.hasQuiz && !quizDataLoading && (
          <>
            <Card hover={false}>
              <div className="space-y-4">
                {/* Quiz title + description */}
                <div>
                  <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1">
                    Quiz
                  </p>
                  <h2 className="text-base font-bold text-[var(--color-text)]">
                    {quizInfo?.title ?? session.title}
                  </h2>
                  {quizInfo?.description && (
                    <p className="text-sm text-[var(--color-muted)] mt-1 leading-relaxed">
                      {quizInfo.description}
                    </p>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                    <span>📝</span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {quizInfo?.questionCount ?? '—'}
                    </span>
                    {' '}questions
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
                    <span>⏱</span>
                    {quizInfo && quizInfo.timeLimitMinutes > 0 ? (
                      <>
                        <span className="font-semibold text-[var(--color-text)]">
                          {quizInfo.timeLimitMinutes}
                        </span>
                        {' '}minute{quizInfo.timeLimitMinutes > 1 ? 's' : ''}
                      </>
                    ) : (
                      <span>Pas de limite de temps</span>
                    )}
                  </div>
                </div>

                {/* Already-submitted score */}
                {myLeaderboardEntry && (
                  <div className="pt-3 border-t border-[var(--color-border)]">
                    <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-2">
                      Votre résultat
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[var(--color-text)]">
                        {myLeaderboardEntry.score}/{myLeaderboardEntry.totalQuestions}
                      </span>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        myLeaderboardEntry.percentage >= 80 ? 'bg-green-500/15 text-green-500' :
                        myLeaderboardEntry.percentage >= 60 ? 'bg-blue-500/15 text-blue-500' :
                        myLeaderboardEntry.percentage >= 40 ? 'bg-amber-500/15 text-amber-500' :
                        'bg-red-500/15 text-red-500'
                      }`}>
                        {Math.round(myLeaderboardEntry.percentage)}%
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        Rang #{myLeaderboardEntry.rank}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* CTA */}
            {myLeaderboardEntry ? (
              <button
                onClick={() => navigate(`/student/session/${sessionId}/quiz/results`, { state: { fromSession: true } })}
                className="w-full py-3 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
              >
                📊 Voir mes résultats →
              </button>
            ) : !sessionClosed ? (
              <button
                onClick={() => navigate(`/student/session/${sessionId}/quiz`)}
                className="w-full py-4 text-base font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Brain size={20} />
                Commencer le quiz →
              </button>
            ) : (
              <div className="w-full py-3 text-center text-sm text-[var(--color-muted)] border border-[var(--color-border)] rounded-xl">
                Session fermée — impossible de passer le quiz
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // CODE MODE — original implementation, untouched
  // ════════════════════════════════════════════════════════════════════
  const sessionClosed = session.status === 'CLOSED'
  const displayResult = runResult ?? (submitResult ? {
    success: submitResult.status === 'SUCCESS',
    output: submitResult.stdout ?? '',
    error: submitResult.stderr ?? '',
    status: submitResult.status,
    language,
    executionTimeMs: submitResult.executionTimeMs,
  } : null)

  const selectedLang = LANGUAGES.find(l => l.value === language)!

  return (
    <div className="space-y-4 page-enter">
      {/* Back */}
      <button
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <ArrowLeft size={15} />
        Retour
      </button>

      {sessionClosed && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
          <AlertTriangle size={15} />
          Cette session est fermée — la soumission de code n'est plus possible.
        </div>
      )}

      <Card hover={false} className="border-primary-500/20 bg-primary-500/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen size={16} className="text-primary-500" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Exercice</span>
              <LangBadge lang={session.language} />
              {session.filiere && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
                  {session.filiere}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-[var(--color-text)]">{session.title}</h1>
            <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
              {session.exercisePrompt || <span className="italic text-[var(--color-muted)]">Aucun énoncé fourni.</span>}
            </p>
          </div>
        </div>
      </Card>

      {/* Editor toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all"
          >
            <span>{LANG_META[language].icon}</span>
            {selectedLang.label}
            <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="absolute top-full mt-1 left-0 z-20 w-44 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden">
              {LANGUAGES.map(l => {
                const m = LANG_META[l.value]
                return (
                  <button
                    key={l.value}
                    onClick={() => handleLangChange(l.value)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-[var(--color-bg)] transition-colors ${
                      l.value === language ? 'text-primary-500 font-semibold' : 'text-[var(--color-text)]'
                    }`}
                  >
                    <span>{m.icon}</span>
                    {l.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowStdin(!showStdin)}
          className={`px-3 py-2 border rounded-lg text-sm transition-all ${
            showStdin
              ? 'border-primary-500/40 text-primary-500 bg-primary-500/10'
              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]'
          }`}
        >
          Entrée standard
        </button>
      </div>

      {showStdin && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Entrée (stdin)</label>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows={3}
            placeholder="Données d'entrée pour le programme..."
            className="ss-input font-mono text-xs resize-y"
          />
        </div>
      )}

      {/* Monaco editor */}
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-card)] border-b border-[var(--color-border)]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-[var(--color-muted)] font-mono ml-1">
            solution.{language === 'cpp' ? 'cpp' : language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language}
          </span>
        </div>
        <Editor
          height="420px"
          language={selectedLang.monacoLang}
          value={code}
          onChange={v => setCode(v ?? '')}
          onMount={e => { editorRef.current = e }}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={running || submitting}
          className="flex items-center gap-2 px-5 py-2.5 border border-[var(--color-border)] text-sm font-semibold rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-all"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Exécution...' : '▶ Tester'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || running || sessionClosed}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-green-500/20 transition-all"
          title={sessionClosed ? 'Session fermée' : undefined}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {submitting ? 'Soumission...' : '✓ Soumettre'}
        </button>

        {sessionClosed && (
          <span className="text-xs text-amber-500">Session fermée</span>
        )}
      </div>

      {/* Output panel */}
      {displayResult && (
        <Card hover={false} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {displayResult.success
                ? <CheckCircle size={15} className="text-green-500" />
                : <XCircle    size={15} className="text-red-500"   />
              }
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {submitResult ? '✓ Code soumis — ' : ''}
                {displayResult.success ? 'Exécution réussie' : "Erreur d'exécution"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Clock size={11} />
              {displayResult.executionTimeMs}ms
            </div>
          </div>

          {displayResult.output && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted)] mb-1 uppercase tracking-wider">Sortie</p>
              <pre className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-sm font-mono text-[var(--color-text)] overflow-x-auto whitespace-pre-wrap">
                {displayResult.output}
              </pre>
            </div>
          )}

          {displayResult.error && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1 uppercase tracking-wider">Erreur</p>
              <pre className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm font-mono text-red-500 overflow-x-auto whitespace-pre-wrap">
                {displayResult.error}
              </pre>
            </div>
          )}

          <button
            onClick={handleAiAnalyze}
            disabled={analyzingAi}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 text-sm font-medium rounded-lg transition-all"
          >
            {analyzingAi ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}
            {analyzingAi ? 'Analyse IA en cours...' : 'Analyser avec IA'}
          </button>
        </Card>
      )}

      {/* AI analysis */}
      {aiAnalysis && (
        <Card hover={false} className="border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={15} className="text-purple-500" />
            <span className="text-sm font-semibold text-[var(--color-text)]">Analyse IA</span>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-[var(--color-text)] font-sans leading-relaxed">
            {aiAnalysis}
          </pre>
        </Card>
      )}
    </div>
  )
}
