import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { GraduationCap, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'

export function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<'STUDENT' | 'PROF'>('STUDENT')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register({ fullName, email, password, role })
      login(res)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/20 mb-4 animate-float">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Créer un compte</h1>
          <p className="text-[var(--color-muted)]">Rejoignez la communauté SmartStudy</p>
        </div>

        <Card className="p-8 border-[var(--color-border)] shadow-xl bg-[var(--color-card)]/50 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  role === 'STUDENT'
                    ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-[var(--color-bg)]/50 border-[var(--color-border)] text-[var(--color-muted)] hover:border-primary-500/50'
                }`}
              >
                Étudiant
              </button>
              <button
                type="button"
                onClick={() => setRole('PROF')}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  role === 'PROF'
                    ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-[var(--color-bg)]/50 border-[var(--color-border)] text-[var(--color-muted)] hover:border-primary-500/50'
                }`}
              >
                Professeur
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">Nom complet</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none"
                  placeholder="jean@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
