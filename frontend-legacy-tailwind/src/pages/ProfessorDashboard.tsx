import { useEffect, useState } from 'react'
import { sessionApi } from '../api/session.api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import type { SessionResponse, Language, SessionType } from '../types'
import { LANGUAGES, LANG_META } from '../types'
import {
  BookOpen, Code2, FileText, Plus, Users, X,
  Loader2, Copy, Check, BookOpenCheck, Eye,
  Brain,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

// ── Quiz type badge ────────────────────────────────────────────────────────
function QuizTypeBadge({ hasQuiz }: { hasQuiz: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
      hasQuiz
        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        : 'bg-[var(--color-border)]/40 text-[var(--color-muted)] border-[var(--color-border)]'
    }`}>
      <Brain size={10} />
      {hasQuiz ? 'Quiz créé' : 'Sans quiz'}
    </span>
  )
}

// ── Inline Create Form ─────────────────────────────────────────────────────
interface CreateFormProps {
  onCreated: (s: SessionResponse) => void
  onCancel: () => void
}

function CreateSessionForm({ onCreated, onCancel }: CreateFormProps) {
  const { showToast } = useToast()
  const [sessionType, setSessionType] = useState<SessionType>('CODE')
  const [title, setTitle]             = useState('')
  const [filiere, setFiliere]         = useState('')
  const [language, setLanguage]       = useState<Language>('python')
  const [exercisePrompt, setExercisePrompt] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const isCode = sessionType === 'CODE'
  const canSubmit = title.trim() && (isCode ? exercisePrompt.trim() : true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const session = await sessionApi.create({
        title: title.trim(),
        sessionType,
        language: isCode ? language : undefined,
        exercisePrompt: isCode ? exercisePrompt.trim() : undefined,
        filiere: filiere.trim() || undefined,
      })
      showToast(
        isCode ? 'Session créée avec succès !' : 'Session quiz créée ! Créez votre quiz maintenant.',
        'success',
      )
      onCreated(session)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la création', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card hover={false} className="border-primary-500/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[var(--color-text)]">Nouvelle session</h2>
        <button onClick={onCancel} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Session type selector ──────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSessionType('CODE')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              sessionType === 'CODE'
                ? 'border-primary-500 bg-primary-500/10 shadow-sm'
                : 'border-[var(--color-border)] hover:border-primary-500/40 hover:bg-[var(--color-bg)]'
            }`}
          >
            <div className="text-lg mb-1">💻</div>
            <p className="text-xs font-semibold text-[var(--color-text)]">Session Code</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-snug">
              Les étudiants écrivent et exécutent du code
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSessionType('QUIZ')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              sessionType === 'QUIZ'
                ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                : 'border-[var(--color-border)] hover:border-purple-500/40 hover:bg-[var(--color-bg)]'
            }`}
          >
            <div className="text-lg mb-1">🧠</div>
            <p className="text-xs font-semibold text-[var(--color-text)]">Session Quiz</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-snug">
              Les étudiants répondent à des QCM
            </p>
          </button>
        </div>

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Titre *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isCode ? 'ex: Cours Python — Listes et dictionnaires' : 'ex: Quiz Algorithmique — Tri et Recherche'}
            className="ss-input"
            required
          />
        </div>

        {/* ── Filière ────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Filière</label>
          <input
            value={filiere}
            onChange={e => setFiliere(e.target.value)}
            placeholder="ex: L2 Informatique, M1 GL..."
            className="ss-input"
          />
        </div>

        {/* ── CODE-only fields ───────────────────────────────────── */}
        {isCode && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">Langage *</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => {
                  const m = LANG_META[l.value]
                  const active = language === l.value
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLanguage(l.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        active
                          ? `${m.bg} ${m.text} ${m.border} shadow-sm`
                          : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]'
                      }`}
                    >
                      <span>{m.icon}</span>
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                Énoncé de l'exercice *
              </label>
              <textarea
                value={exercisePrompt}
                onChange={e => setExercisePrompt(e.target.value)}
                rows={5}
                placeholder="Rédigez ici l'énoncé de l'exercice. Les étudiants le verront dès qu'ils rejoignent la session."
                className="ss-input resize-y"
                required
              />
            </div>
          </>
        )}

        {/* ── QUIZ hint ─────────────────────────────────────────── */}
        {!isCode && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/8 border border-purple-500/20 text-xs text-purple-400">
            <Brain size={13} className="mt-0.5 flex-shrink-0" />
            Après la création, vous serez redirigé vers l'éditeur de quiz pour créer vos questions ou en générer depuis un PDF.
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-sm border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg)] transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className={`flex-1 py-2 text-sm disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isCode
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Créer
          </button>
        </div>
      </form>
    </Card>
  )
}

// ── Duplicate inline form ──────────────────────────────────────────────────
interface DupFormProps {
  session: SessionResponse
  onDuplicated: (s: SessionResponse) => void
  onCancel: () => void
}

function DuplicateForm({ session, onDuplicated, onCancel }: DupFormProps) {
  const { showToast } = useToast()
  const [title, setTitle]     = useState(session.title + ' (copie)')
  const [filiere, setFiliere] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const dup = await sessionApi.duplicateSession(session.id, {
        title: title.trim() || undefined,
        filiere: filiere.trim() || undefined,
      })
      showToast('Session dupliquée avec succès !', 'success')
      onDuplicated(dup)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Erreur lors de la duplication', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="mt-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] space-y-3"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-xs font-semibold text-[var(--color-text)]">Dupliquer cette session</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre de la copie"
          className="ss-input text-xs"
        />
        <input
          value={filiere}
          onChange={e => setFiliere(e.target.value)}
          placeholder="Nouvelle filière (ex: L3 Informatique)"
          className="ss-input text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-1.5 text-xs border border-[var(--color-border)] rounded-md text-[var(--color-muted)] hover:bg-[var(--color-card)] transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-1.5 text-xs bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-md transition-all flex items-center justify-center gap-1"
          >
            {submitting ? <Loader2 size={11} className="animate-spin" /> : null}
            Dupliquer
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function ProfessorDashboard() {
  const { currentUser } = useAuth()
  const navigate        = useNavigate()
  const [sessions, setSessions]       = useState<SessionResponse[]>([])
  const [loading, setLoading]         = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [copiedCode, setCopiedCode]   = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  const load = () =>
    sessionApi.getMySessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreated = (session: SessionResponse) => {
    setSessions(prev => [session, ...prev])
    setShowCreate(false)
    // For QUIZ sessions, go straight to the quiz creator
    if (session.sessionType === 'QUIZ') {
      navigate(`/professor/session/${session.id}/quiz/create`)
    }
  }

  const handleDuplicated = (dup: SessionResponse) => {
    setSessions(prev => [dup, ...prev])
    setDuplicatingId(null)
  }

  const openSessions   = sessions.filter(s => s.status === 'OPEN')
  const closedSessions = sessions.filter(s => s.status === 'CLOSED')

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <BookOpenCheck size={20} className="text-primary-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">
              Bonjour, {currentUser?.fullName} 👋
            </h1>
            <p className="text-xs text-[var(--color-muted)]">Tableau de bord professeur</p>
          </div>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-primary-500/20"
          >
            <Plus size={14} />
            Nouvelle session
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sessions actives',  value: openSessions.length,   color: 'text-green-500 bg-green-500/10' },
          { label: 'Sessions fermées',  value: closedSessions.length, color: 'text-[var(--color-muted)] bg-[var(--color-border)]/40' },
          { label: 'Total étudiants',   value: sessions.reduce((acc, s) => acc + s.studentCount, 0), color: 'text-primary-500 bg-primary-500/10' },
        ].map(stat => (
          <Card key={stat.label} hover={false} className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
              <Users size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-[var(--color-text)]">{stat.value}</p>
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/code-editor')}>
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
            <Code2 size={18} className="text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Éditeur de code</p>
            <p className="text-xs text-[var(--color-muted)]">Démontrez du code en direct</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/pdf-simplifier')}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <FileText size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">PDF Simplifier</p>
            <p className="text-xs text-[var(--color-muted)]">Résumez des cours en IA</p>
          </div>
        </Card>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <CreateSessionForm
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Sessions list */}
      <Card hover={false}>
        <CardHeader
          title="Mes sessions"
          subtitle={`${sessions.length} session(s)`}
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg skeleton-shimmer" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen size={32} className="mx-auto text-[var(--color-border)] mb-3" />
            <p className="text-sm text-[var(--color-muted)]">Aucune session créée</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-xs text-primary-500 hover:underline"
            >
              Créer votre première session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => {
              const isQuiz = (s.sessionType ?? 'CODE') === 'QUIZ'
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors"
                >
                  {/* Card top row */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--color-text)]">{s.title}</p>
                        {s.filiere && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-muted)]">
                            {s.filiere}
                          </span>
                        )}
                        {isQuiz
                          ? <QuizTypeBadge hasQuiz={s.hasQuiz} />
                          : <LangBadge lang={s.language} />
                        }
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.status === 'OPEN'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-[var(--color-border)]/50 text-[var(--color-muted)]'
                        }`}>
                          {s.status === 'OPEN' ? '● Active' : 'Fermée'}
                        </span>
                      </div>

                      {/* Preview line */}
                      {!isQuiz && s.exercisePrompt && (
                        <p className="text-xs text-[var(--color-muted)] line-clamp-1 max-w-lg">
                          {s.exercisePrompt.slice(0, 80)}{s.exercisePrompt.length > 80 ? '…' : ''}
                        </p>
                      )}

                      {/* Count + code */}
                      <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                        <span>{s.studentCount} étudiant(s)</span>
                        {s.status === 'OPEN' && (
                          <button
                            onClick={() => copyCode(s.joinCode)}
                            className="flex items-center gap-1 font-mono tracking-widest text-primary-500 hover:underline"
                          >
                            {copiedCode === s.joinCode ? <Check size={10} /> : <Copy size={10} />}
                            {s.joinCode}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isQuiz && !s.hasQuiz && s.status === 'OPEN' && (
                        <button
                          onClick={() => navigate(`/professor/session/${s.id}/quiz/create`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-purple-500/40 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-all"
                        >
                          <Brain size={12} />
                          Créer quiz
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/professor/session/${s.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all"
                      >
                        <Eye size={12} />
                        Voir
                      </button>
                      <button
                        onClick={() => setDuplicatingId(duplicatingId === s.id ? null : s.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all"
                      >
                        <Copy size={12} />
                        Dupliquer
                      </button>
                    </div>
                  </div>

                  {/* Inline duplicate form */}
                  {duplicatingId === s.id && (
                    <DuplicateForm
                      session={s}
                      onDuplicated={handleDuplicated}
                      onCancel={() => setDuplicatingId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
