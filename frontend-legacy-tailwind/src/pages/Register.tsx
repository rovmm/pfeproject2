import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import Icon from '../components/Icon'

const FEATURES = ['Live code & quiz sessions', 'AI quiz generation from PDFs', 'Real-time leaderboards']

export function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'PROF'>('STUDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({ fullName, email, password, role })
      login(res)
      navigate(role === 'PROF' ? '/professor/dashboard' : '/student/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: 24 }}>
      <div style={{ width: 1000, maxWidth: '100%', minHeight: 720, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <AuthBrandPanel width={400} heading="Join thousands of learners & educators." features={FEATURES} />
        <div style={{ flex: 1, background: 'var(--surface)', padding: '44px 48px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: '0 0 6px' }}>Créer un compte</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 22px' }}>Rejoignez la communauté SmartStudy.</p>

          {error && (
            <div className="toast toast-error" style={{ marginBottom: 20 }}>
              <Icon name="alert-triangle" size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <button
              type="button"
              className={`session-type-card ${role === 'STUDENT' ? 'session-type-card-selected' : ''}`}
              onClick={() => setRole('STUDENT')}
              style={{ borderRadius: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              {role === 'STUDENT' && (
                <span style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={11} />
                </span>
              )}
              <div className="session-type-icon" style={{ marginBottom: 12 }}>
                <Icon name="grad-cap" size={20} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Étudiant</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, lineHeight: 1.4 }}>Rejoindre des sessions, coder et passer des quiz</div>
            </button>
            <button
              type="button"
              className={`session-type-card ${role === 'PROF' ? 'session-type-card-selected' : ''}`}
              onClick={() => setRole('PROF')}
              style={{ borderRadius: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              {role === 'PROF' && (
                <span style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={11} />
                </span>
              )}
              <div className="session-type-icon" style={{ marginBottom: 12 }}>
                <Icon name="user-check" size={20} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Professeur</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, lineHeight: 1.4 }}>Créer des sessions et suivre les étudiants</div>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="field-label">Nom complet</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Dupont" required />
            <label className="field-label" style={{ marginTop: 16 }}>
              Email
            </label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@exemple.com" required />
            <label className="field-label" style={{ marginTop: 16 }}>
              Mot de passe
            </label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 24 }} disabled={loading}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', margin: '18px 0 0' }}>
            Déjà inscrit ?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
