import { useEffect, useState } from 'react'
import { sessionApi } from '../api/session.api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardHeader } from '../components/ui/Card'
import type { SessionResponse, Language } from '../types'
import { LANG_META, LANGUAGES } from '../types'
import {
  BookOpen, Code2, FileText, Hash, Users, Clock,
  LogIn, Loader2, GraduationCap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function LangBadge({ lang }: { lang?: Language }) {
  if (!lang || !LANG_META[lang]) return null
  const m = LANG_META[lang]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span>{m.icon}</span>
      {LANGUAGES.find(l => l.value === lang)?.label ?? lang}
    </span>
  )
}

export function StudentDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    sessionApi.getMyStudentSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const joined = await sessionApi.join(joinCode.trim())
      setJoinCode('')
      // Navigate directly to the session page
      navigate(`/student/session/${joined.id}`)
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Code invalide ou session introuvable')
    } finally {
      setJoining(false)
    }
  }

  const openSessions   = sessions.filter(s => s.status === 'OPEN')
  const closedSessions = sessions.filter(s => s.status === 'CLOSED')

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <GraduationCap size={20} className="text-primary-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">
            Bonjour, {currentUser?.fullName} 👋
          </h1>
          <p className="text-xs text-[var(--color-muted)]">Tableau de bord étudiant</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sessions actives',   value: openSessions.length,   icon: <BookOpen size={16} />, color: 'text-green-500 bg-green-500/10' },
          { label: 'Sessions terminées', value: closedSessions.length, icon: <Clock size={16} />,    color: 'text-[var(--color-muted)] bg-[var(--color-border)]/40' },
          { label: 'Total sessions',     value: sessions.length,       icon: <Users size={16} />,    color: 'text-primary-500 bg-primary-500/10' },
        ].map(stat => (
          <Card key={stat.label} hover={false} className="flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
              {stat.icon}
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
            <p className="text-xs text-[var(--color-muted)]">Python, JS, Java, C++...</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/pdf-simplifier')}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <FileText size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">PDF Simplifier</p>
            <p className="text-xs text-[var(--color-muted)]">Résumé IA de documents</p>
          </div>
        </Card>
      </div>

      {/* Join session */}
      <Card hover={false}>
        <CardHeader title="Rejoindre une session" subtitle="Entrez le code donné par votre professeur" />
        <form onSubmit={handleJoin} className="flex gap-3">
          <div className="relative flex-1">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CODE123"
              className="ss-input pl-8 font-mono tracking-widest uppercase"
              maxLength={10}
            />
          </div>
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
          >
            {joining ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            Rejoindre
          </button>
        </form>
        {joinError && <p className="mt-2 text-xs text-red-500">{joinError}</p>}
      </Card>

      {/* Sessions list */}
      <Card hover={false}>
        <CardHeader title="Mes sessions" subtitle={`${sessions.length} session(s) au total`} />
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-lg skeleton-shimmer" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen size={32} className="mx-auto text-[var(--color-border)] mb-3" />
            <p className="text-sm text-[var(--color-muted)]">Aucune session pour l'instant</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Rejoignez une session avec un code</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => navigate(`/student/session/${s.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-[var(--color-border)]'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{s.title}</p>
                      <LangBadge lang={s.language} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[var(--color-muted)]">Prof: {s.profName}</p>
                      {s.exercisePrompt && (
                        <p className="text-xs text-[var(--color-muted)] truncate max-w-xs hidden sm:block">
                          — {s.exercisePrompt.slice(0, 60)}{s.exercisePrompt.length > 60 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  s.status === 'OPEN'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-[var(--color-border)]/50 text-[var(--color-muted)]'
                }`}>
                  {s.status === 'OPEN' ? 'Active' : 'Terminée'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
