import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBrandPanel from '../components/AuthBrandPanel';
import Icon from '../components/Icon';
import { useAuth } from '../lib/auth';

const FEATURES = ['Launch live sessions in one click', 'Run & grade code in real time', 'Auto-scored quizzes & analytics'];

export default function Login() {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await loginWithCredentials(email, password);
      navigate(`/${user.role}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: 24 }}>
      <div style={{ width: 1000, maxWidth: '100%', minHeight: 640, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <AuthBrandPanel heading="Teach, code and quiz — all in one place." body="Sign in to launch live sessions, run code and track every student in real time." features={FEATURES} />
        <div style={{ flex: 1, background: 'var(--surface)', padding: '56px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: 'var(--ink)', margin: '0 0 6px' }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 24px' }}>Enter your credentials to continue.</p>

          {error && (
            <div className="toast toast-error" style={{ marginBottom: 20 }}>
              <Icon name="alert-triangle" size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="field-label">Email address</label>
            <div className="input-row" style={{ marginBottom: error && !password ? 18 : 6, ...(error ? { border: '1px solid var(--error-input-border)', background: 'var(--error-input-bg)' } : {}) }}>
              <span className="input-row-icon" style={error ? { color: 'var(--error)' } : undefined}>
                <Icon name="mail" size={16} />
              </span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {!error && <div style={{ marginBottom: 12 }} />}

            <label className="field-label">Password</label>
            <div className="input-row" style={{ marginBottom: 10 }}>
              <span className="input-row-icon">
                <Icon name="lock" size={16} />
              </span>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="input-row-icon" style={{ cursor: 'pointer' }} onClick={() => setShowPassword((s) => !s)}>
                <Icon name="eye" size={16} />
              </span>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 22 }}>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2.5px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', margin: '22px 0 0' }}>
            New here?{' '}
            <Link to="/register" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
