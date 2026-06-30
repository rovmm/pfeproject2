import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { GraduationCap, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login({ email, password })
      login(res)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/20 mb-4 animate-float">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Bienvenue !</h1>
          <p className="text-[var(--color-muted)]">Connectez-vous à votre espace SmartStudy</p>
        </div>

        <Card className="p-8 border-[var(--color-border)] shadow-xl bg-[var(--color-card)]/50 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">Mot de passe</label>
                <a href="#" className="text-xs text-primary-500 hover:underline">Oublié ?</a>
              </div>
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
                  Connexion
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-500 font-semibold hover:underline">
              S'inscrire gratuitement
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
