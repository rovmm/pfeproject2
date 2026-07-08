import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBrandPanel from '../components/AuthBrandPanel';
import Icon from '../components/Icon';
import { useAuth, type Role } from '../lib/auth';

const FEATURES = ['Live code & quiz sessions', 'AI quiz generation from PDFs', 'Real-time leaderboards'];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Extract<Role, 'student' | 'professor'>>('student');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login(role);
    navigate(role === 'student' ? '/student' : '/professor');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: 24 }}>
      <div style={{ width: 1000, maxWidth: '100%', minHeight: 720, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <AuthBrandPanel width={400} heading="Join thousands of learners & educators." features={FEATURES} />
        <div style={{ flex: 1, background: 'var(--surface)', padding: '44px 48px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: '0 0 6px' }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 22px' }}>Choose how you'll use SmartStudy.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <button
              type="button"
              className={`session-type-card ${role === 'student' ? 'session-type-card-selected' : ''}`}
              onClick={() => setRole('student')}
              style={{ borderRadius: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              {role === 'student' && (
                <span style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={11} />
                </span>
              )}
              <div className="session-type-icon" style={{ marginBottom: 12 }}>
                <Icon name="grad-cap" size={20} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Student</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, lineHeight: 1.4 }}>Join sessions, code &amp; take quizzes</div>
            </button>
            <button
              type="button"
              className={`session-type-card ${role === 'professor' ? 'session-type-card-selected' : ''}`}
              onClick={() => setRole('professor')}
              style={{ borderRadius: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              <div className="session-type-icon" style={{ marginBottom: 12 }}>
                <Icon name="user-check" size={20} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Professor</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3, lineHeight: 1.4 }}>Create sessions &amp; track students</div>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="field-label">Full name</label>
                <input className="input" placeholder="Full name" required />
              </div>
              <div>
                <label className="field-label">Institution</label>
                <input className="input" defaultValue="Université de Lyon" required />
              </div>
            </div>
            <label className="field-label" style={{ marginTop: 16 }}>
              Email address
            </label>
            <input className="input" type="email" placeholder="example@gmail.com" required />
            <label className="field-label" style={{ marginTop: 16 }}>
              Password
            </label>
            <input className="input" type="password" defaultValue="" placeholder="Create a password" required />
            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 24 }}>
              Create account
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', margin: '18px 0 0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
