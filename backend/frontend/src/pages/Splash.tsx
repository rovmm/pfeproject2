import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';

const chips: { icon: 'user-check' | 'check' | 'code'; label: string }[] = [
  { icon: 'user-check', label: 'Live sessions' },
  { icon: 'check', label: 'Quizzes' },
  { icon: 'code', label: 'Run code' },
];

export default function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(155deg,#dbe6f7 0%,#fdf7ec 48%,#f0e6f3 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: '60px 20px 0' }}>
        <div style={{ filter: 'drop-shadow(0 20px 34px rgba(30,58,138,0.34))' }}>
          <Logo size={160} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 64, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>
            Smart<span style={{ color: 'var(--navy)' }}>Study</span>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 20, color: 'var(--ink-muted)' }}>Learn Smarter, Not Harder.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {chips.map((c) => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(30,58,138,0.12)',
                borderRadius: 999,
                padding: '9px 16px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 13.5,
                color: 'var(--navy)',
              }}
            >
              <Icon name={c.icon} size={16} /> {c.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', padding: '44px 20px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Link
          to="/login"
          style={{
            width: 340,
            maxWidth: '100%',
            border: 'none',
            cursor: 'pointer',
            padding: 20,
            borderRadius: 18,
            background: 'var(--brand-gradient)',
            color: '#fff',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: '0.01em',
            boxShadow: 'var(--shadow-btn-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          Get Started
          <Icon name="arrow-right" size={20} strokeWidth={2.2} />
        </Link>
        <Link to="/login" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6b6455', textDecoration: 'none' }}>
          Already have an account? <span style={{ color: 'var(--navy)', fontWeight: 600 }}>Sign in</span>
        </Link>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#a49b88', marginTop: 6 }}>By Power Rangers Team</div>
      </div>
    </div>
  );
}
