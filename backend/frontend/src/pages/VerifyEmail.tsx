import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthBrandPanel from '../components/AuthBrandPanel';
import Icon from '../components/Icon';
import { useAuth } from '../lib/auth';

const FEATURES = ['Launch live sessions in one click', 'Run & grade code in real time', 'Auto-scored quizzes & analytics'];
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { verifyEmailCode, resendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const user = await verifyEmailCode(email, code);
      navigate(`/${user.role}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setResending(true);
    try {
      await resendVerificationCode(email);
      setInfo('A new code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: 24 }}>
      <div style={{ width: 1000, maxWidth: '100%', minHeight: 640, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <AuthBrandPanel heading="Almost there." body="Enter the 6-digit code we emailed you to activate your account." features={FEATURES} />
        <div style={{ flex: 1, background: 'var(--surface)', padding: '56px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: 'var(--ink)', margin: '0 0 6px' }}>Verify your email</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 24px' }}>
            We sent a 6-digit code to your email address. Enter it below to activate your account.
          </p>

          {error && (
            <div className="toast toast-error" style={{ marginBottom: 20 }}>
              <Icon name="alert-triangle" size={16} /> {error}
            </div>
          )}
          {info && !error && (
            <div className="toast toast-success" style={{ marginBottom: 20 }}>
              <Icon name="check" size={16} /> {info}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="field-label">Email address</label>
            <div className="input-row" style={{ marginBottom: 16 }}>
              <span className="input-row-icon">
                <Icon name="mail" size={16} />
              </span>
              <input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <label className="field-label">Verification code</label>
            <div className="input-row" style={{ marginBottom: 10 }}>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ letterSpacing: '0.3em', fontWeight: 700 }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 22 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: cooldown > 0 ? 'var(--ink-muted)' : 'var(--navy)',
                  cursor: cooldown > 0 || resending ? 'default' : 'pointer',
                }}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', margin: '22px 0 0' }}>
            Wrong email? <Link to="/register" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>Register again</Link>
            {' · '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
