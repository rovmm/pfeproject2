import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const GREEN = '#89c540';

function Check({ color = GREEN }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Reveal({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(26px)',
        transition: `opacity 0.7s ${delay}s cubic-bezier(.22,.61,.36,1), transform 0.7s ${delay}s cubic-bezier(.22,.61,.36,1)`,
      }}
    >
      {children}
    </div>
  );
}

function Counter({ to, decimals = 0, suffix }: { to: number; decimals?: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const dur = 1400;
            const step = (now: number) => {
              const p = Math.min(1, (now - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              setVal(to * eased);
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div ref={ref} style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 40, color: '#fff', letterSpacing: '-0.02em' }}>
      {decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      <span style={{ fontSize: 24 }}>{suffix}</span>
    </div>
  );
}

const features = [
  {
    title: 'Live Coding Sessions',
    body: 'Professor creates a session and shares a 6-character code. Students join instantly, read the exercise, write their code in the editor, and submit. Professor watches every submission appear live on the dashboard in real time.',
    bg: 'var(--brand-gradient)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
    ),
  },
  {
    title: 'Code Editor',
    body: 'A full Monaco editor running directly in the browser — no installation needed. Write and run code in 6 languages, get instant execution results, and use Solve AI to understand your errors.',
    bg: 'var(--ink)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6l-5 6 5 6" /><path d="M16 6l5 6-5 6" /></svg>
    ),
  },
  {
    title: 'AI Quiz Generator',
    body: "Generate MCQ quizzes from any PDF in seconds using AI, or build them manually question by question. Students answer live during the session. Professor sees the leaderboard and every student's score update in real time.",
    bg: 'linear-gradient(135deg,#2c53ab,#3a63c4)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
    ),
  },
  {
    title: 'Solve',
    tag: 'Your AI programming assistant',
    body: 'Ask Solve anything about your code. It explains errors, debugs programs, generates exercises, and answers CS questions — available 24/7.',
    bg: 'var(--ink)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6z" /></svg>
    ),
  },
  {
    title: 'CodrDrive',
    tag: 'Course materials, organized',
    body: 'Professors upload PDFs, slides and code files. Students access only what is shared. AI actions built into every file — summarize, generate quiz, explain.',
    bg: 'linear-gradient(135deg,#2c53ab,#3a63c4)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l2-3h6l2 3" /><path d="M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M12 11v5" /><path d="M9.5 13.5L12 11l2.5 2.5" /></svg>
    ),
  },
];

const faqs = [
  {
    q: 'Is SmartStudy really free for students?',
    a: 'Yes — completely free forever. Students can join sessions, run code in 6 programming languages, use the AI assistant (20 messages/day), and access all shared course materials with no credit card required.',
  },
  {
    q: 'How does the live coding session work?',
    a: "The professor creates a session, writes an exercise prompt, and selects a programming language. Students enter a 6-character code to join. They see the exercise, write their solution in the Monaco code editor, and submit. The professor sees every student's result in real time on their dashboard.",
  },
  {
    q: 'Is the code execution secure?',
    a: 'Yes. Every piece of student code runs inside an isolated Docker container with no network access, limited to 128MB of memory and 10 seconds of execution time. The container is destroyed immediately after each run. Student code never touches the production server directly.',
  },
  {
    q: 'How does the AI quiz generation work?',
    a: 'The professor uploads a PDF course document. SmartStudy extracts the text and sends it to the AI model, which generates MCQ questions with 4 options and correct answers. The professor reviews the questions before publishing the quiz to students.',
  },
  {
    q: 'Can professors disable AI during exams?',
    a: 'Yes. When creating a session, professors can enable exam security flags: disable the AI assistant, block copy-paste, warn when students switch tabs, set a time limit, and record the complete coding history of each student.',
  },
  {
    q: 'What programming languages are supported?',
    a: 'SmartStudy currently supports Python, JavaScript, TypeScript, Java, C++, and PHP. All languages run in secure Docker containers with their respective official Alpine-based images.',
  },
  {
    q: 'Can I use SmartStudy on mobile?',
    a: 'The platform is optimized for desktop use since it includes a full code editor (Monaco). The dashboard and quiz features are accessible on tablet. A mobile app is planned for a future version.',
  },
];

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <Reveal style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 20px 50px -40px rgba(20,20,39,0.4)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: open ? '#faf6ec' : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '22px 26px',
          textAlign: 'left',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 16.5,
          color: 'var(--ink)',
          borderRadius: 16,
        }}
      >
        {q}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flex: 'none', transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        ref={bodyRef}
        style={{
          maxHeight: open ? bodyRef.current?.scrollHeight ?? 500 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.32s ease',
        }}
      >
        <p style={{ margin: 0, padding: '0 26px 24px', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.65, color: '#6b6455' }}>{a}</p>
      </div>
    </Reveal>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ overflowX: 'hidden', background: 'var(--surface)' }}>
      <style>{`
        @keyframes ss-float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-16px); } }
        @keyframes ss-float2 { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(12px); } }
        @keyframes ss-blink { 0%,49%{ opacity:1; } 50%,100%{ opacity:0; } }
        @keyframes ss-pulse { 0%,100%{ transform:scale(1); opacity:1; } 50%{ transform:scale(1.35); opacity:0.55; } }
        @keyframes ss-badgepulse { 0%,100%{ transform:scale(1); box-shadow:0 0 0 0 rgba(137,197,64,0.5); } 50%{ transform:scale(1.06); box-shadow:0 0 0 8px rgba(137,197,64,0); } }
        .ss-price-card { transition:transform 0.2s ease, box-shadow 0.2s ease; }
        .ss-price-card:hover { transform:translateY(-6px); box-shadow:0 46px 90px -34px rgba(20,20,39,0.45); }
        .ss-nav-link { font-family:'Inter',sans-serif; font-weight:500; font-size:14.5px; color:rgba(255,255,255,0.82); text-decoration:none; transition:transform 0.15s ease, color 0.15s ease; display:inline-block; }
        .ss-nav-link:hover { color:#fff; transform:translateY(-1px); }
        .ss-nav-link:active { transform:translateY(0) scale(0.94); }
        .ss-click { transition:transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease; }
        .ss-click:hover { filter:brightness(1.05); transform:translateY(-1px); }
        .ss-click:active { transform:translateY(0) scale(0.96); filter:brightness(0.96); }
      `}</style>

      {/* ================= HERO ================= */}
      <div style={{ position: 'relative', paddingBottom: 120 }}>
        <div style={{ position: 'absolute', inset: 0, height: 760, background: 'linear-gradient(135deg,#1e3a8a 0%,#2c53ab 60%,#3a63c4 100%)', clipPath: 'polygon(0 0, 100% 0, 100% 62%, 0 100%)' }} />
        <div style={{ position: 'absolute', top: -120, right: '8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(137,197,64,0.35),transparent 70%)', filter: 'blur(10px)', animation: 'ss-float 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: 120, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(185,168,255,0.28),transparent 70%)', filter: 'blur(10px)', animation: 'ss-float2 11s ease-in-out infinite' }} />

        {/* NAV */}
        <nav style={{ position: 'relative', zIndex: 10, maxWidth: 1240, margin: '0 auto', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={40} onDark gradient={false} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 23, letterSpacing: '-0.02em', color: '#fff' }}>SmartStudy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginRight: 14 }}>
              <a href="#features" className="ss-nav-link">Features</a>
              <a href="#solve" className="ss-nav-link">Solve</a>
              <a href="#codrdrive" className="ss-nav-link">CodrDrive</a>
              <a href="#pricing" className="ss-nav-link">Pricing</a>
            </div>
            <Link to="/login" className="ss-click" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, color: '#fff', textDecoration: 'none', padding: '11px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}>
              Log in
            </Link>
            <Link to="/register" className="ss-click" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--navy)', textDecoration: 'none', padding: '12px 22px', borderRadius: 999, background: '#fff', boxShadow: '0 10px 26px -12px rgba(0,0,0,0.4)' }}>
              Get Started Free
            </Link>
          </div>
        </nav>

        {/* HERO GRID */}
        <div style={{ position: 'relative', zIndex: 5, maxWidth: 1240, margin: '0 auto', padding: '44px 40px 0', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '7px 15px', marginBottom: 26 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, animation: 'ss-pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#fff' }}>For students &amp; educators</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 22px' }}>
              A smarter way<br />to study together
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 34px', maxWidth: 460 }}>
              Learn. Code. Quiz. SmartStudy is the all-in-one platform where classes run live sessions, write code, and quiz together — in real time.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 34 }}>
              <Link to="/register" className="ss-click" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', textDecoration: 'none', padding: '17px 30px', borderRadius: 14, background: '#fff', boxShadow: '0 16px 34px -14px rgba(0,0,0,0.45)' }}>
                Get Started for Free
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="M12 6l6 6-6 6" /></svg>
              </Link>
              <a href="#platform" className="ss-click" style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15, color: '#fff', textDecoration: 'none', padding: '16px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.32)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={GREEN}><path d="M8 5v14l11-7z" /></svg>
                Watch demo
              </a>
            </div>
          </div>

          <div style={{ position: 'relative', height: 480 }}>
            <div style={{ position: 'absolute', top: 40, left: '6%', width: '74%', background: '#fff', borderRadius: 20, boxShadow: '0 40px 80px -30px rgba(20,20,39,0.55)', overflow: 'hidden', animation: 'ss-float 7s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '14px 16px', borderBottom: '1px solid #f0eef6' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: '#a49b88' }}>session.py</span>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 11, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 11, width: 14 }}>1</span><span style={{ height: 9, width: '38%', borderRadius: 5, background: 'var(--navy)' }} /><span style={{ height: 9, width: '22%', borderRadius: 5, background: GREEN }} /></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 11, width: 14 }}>2</span><span style={{ height: 9, width: '55%', borderRadius: 5, background: '#e4d9c2' }} /></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 11, width: 14 }}>3</span><span style={{ height: 9, width: '30%', borderRadius: 5, background: '#e4d9c2', marginLeft: 16 }} /><span style={{ height: 9, width: '26%', borderRadius: 5, background: 'var(--navy-light)' }} /></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 11, width: 14 }}>4</span><span style={{ height: 9, width: '44%', borderRadius: 5, background: '#e4d9c2', marginLeft: 16 }} /><span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--navy)', animation: 'ss-blink 1.1s step-end infinite' }} /></div>
              </div>
            </div>

            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, background: '#fff', borderRadius: 18, boxShadow: '0 30px 60px -26px rgba(20,20,39,0.5)', padding: 18, animation: 'ss-float2 6s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Live Quiz</span>
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#8a8271', marginBottom: 10 }}>Question 4 of 10</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ height: 10, borderRadius: 5, background: '#f0e6d3' }} />
                <div style={{ height: 10, borderRadius: 5, background: GREEN, width: '70%' }} />
                <div style={{ height: 10, borderRadius: 5, background: '#f0e6d3', width: '85%' }} />
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 6, left: 0, width: 230, background: 'var(--ink)', borderRadius: 18, boxShadow: '0 30px 60px -26px rgba(20,20,39,0.6)', padding: '16px 18px', animation: 'ss-float 8s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57', animation: 'ss-pulse 1.6s ease-in-out infinite' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, color: '#fff' }}>Live session</span>
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--navy-light)', border: '2px solid var(--ink)' }} />
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: GREEN, border: '2px solid var(--ink)', marginLeft: -8 }} />
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#b9a8ff', border: '2px solid var(--ink)', marginLeft: -8 }} />
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#3a63c4', border: '2px solid var(--ink)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, color: '#fff' }}>+21</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div id="features" style={{ position: 'relative', zIndex: 6, maxWidth: 1180, margin: '96px auto 0', padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28 }}>
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05} style={i === 1 ? { transform: 'translateY(-18px)' } : undefined}>
              <div id={f.title === 'Solve' ? 'solve' : f.title === 'CodrDrive' ? 'codrdrive' : undefined} style={{ background: '#fff', borderRadius: 22, padding: '36px 32px', boxShadow: '0 40px 80px -40px rgba(20,20,39,0.35)', border: '1px solid #f0eef6', height: '100%' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: f.tag ? '0 0 4px' : '0 0 10px' }}>{f.title}</h3>
                {f.tag && <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: GREEN, margin: '0 0 10px' }}>{f.tag}</div>}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, lineHeight: 1.65, color: '#6b6455', margin: 0 }}>{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 40px' }}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, background: 'var(--brand-gradient)', borderRadius: 24, padding: '44px 40px' }}>
            <div style={{ textAlign: 'center' }}><Counter to={120} suffix="" /><div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>K+ students</div></div>
            <div style={{ textAlign: 'center' }}><Counter to={4800} suffix="" /><div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>classrooms</div></div>
            <div style={{ textAlign: 'center' }}><Counter to={1.2} decimals={1} suffix="" /><div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>M quizzes taken</div></div>
            <div style={{ textAlign: 'center' }}><span style={{ color: GREEN }}><Counter to={99} suffix="" /></span><div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>% would recommend</div></div>
          </div>
        </Reveal>
      </div>

      {/* ================= PLATFORM ================= */}
      <div id="platform" style={{ maxWidth: 1180, margin: '120px auto 0', padding: '0 40px', textAlign: 'center' }}>
        <Reveal><div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', color: GREEN, marginBottom: 14 }}>Everything in one place</div></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 44, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '0 auto 18px', maxWidth: 640, lineHeight: 1.1 }}>The platform you need to learn smarter</h2></Reveal>
        <Reveal delay={0.1}><p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: '#6b6455', margin: '0 auto', maxWidth: 560 }}>No more juggling five apps. SmartStudy brings teaching, coding and assessment together so learning actually flows.</p></Reveal>
      </div>

      <div style={{ maxWidth: 1080, margin: '70px auto 0', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 80 }}>
        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint-indigo)', borderRadius: 999, padding: '7px 14px', marginBottom: 18 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--navy)' }} /><span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--navy)' }}>Teach live</span></div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.15 }}>Run a live coding class in one click</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.65, color: '#6b6455', margin: '0 0 22px' }}>Create a session, write the exercise, and share a 6-character code. Students join instantly and submit their solutions while you watch every result land live on your dashboard.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-secondary)' }}><Check />Join instantly with a 6-character code</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-secondary)' }}><Check />Live submission tracking on the dashboard</li>
              </ul>
            </div>
            <div style={{ position: 'relative', background: 'var(--page-bg)', borderRadius: 24, padding: 26, height: 320, overflow: 'hidden' }}>
              <div style={{ position: 'relative', background: 'var(--ink)', borderRadius: 16, padding: '18px 20px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ marginLeft: 8, fontFamily: 'var(--font-body)', fontSize: 11, color: '#6b6b85' }}>solution.py</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, lineHeight: 1.9, color: '#e4d9c2' }}>
                  <div><span style={{ color: '#b9a8ff' }}>def</span> <span style={{ color: GREEN }}>is_prime</span>(n):</div>
                  <div style={{ paddingLeft: 20 }}><span style={{ color: '#b9a8ff' }}>if</span> n &lt; 2: <span style={{ color: '#b9a8ff' }}>return</span> <span style={{ color: '#f6a25c' }}>False</span></div>
                  <div style={{ paddingLeft: 20 }}><span style={{ color: '#b9a8ff' }}>for</span> i <span style={{ color: '#b9a8ff' }}>in</span> <span style={{ color: GREEN }}>range</span>(2, n):</div>
                  <div style={{ paddingLeft: 40 }}><span style={{ color: '#b9a8ff' }}>if</span> n % i == 0: <span style={{ color: '#b9a8ff' }}>return</span> <span style={{ color: '#f6a25c' }}>False</span></div>
                  <div style={{ paddingLeft: 20 }}><span style={{ color: '#b9a8ff' }}>return</span> <span style={{ color: '#f6a25c' }}>True</span></div>
                </div>
                <div style={{ marginTop: 'auto', background: '#0d0d1a', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: GREEN }}>Output: True · ran in 0.02s</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div style={{ position: 'relative', background: 'var(--ink)', borderRadius: 24, padding: 26, height: 320, overflow: 'hidden', order: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-heading)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 12, width: 16 }}>1</span><span style={{ height: 10, width: '40%', borderRadius: 5, background: GREEN }} /><span style={{ height: 10, width: '24%', borderRadius: 5, background: '#3a63c4' }} /></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 12, width: 16 }}>2</span><span style={{ height: 10, width: '60%', borderRadius: 5, background: '#2c3350', marginLeft: 20 }} /></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 12, width: 16 }}>3</span><span style={{ height: 10, width: '34%', borderRadius: 5, background: '#2c3350', marginLeft: 20 }} /><span style={{ height: 10, width: '28%', borderRadius: 5, background: '#b9a8ff' }} /></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ color: '#b9a8ff', fontSize: 12, width: 16 }}>4</span><span style={{ height: 10, width: '50%', borderRadius: 5, background: '#2c3350' }} /></div>
              </div>
              <div style={{ marginTop: 20, background: '#0d0d1a', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="M12 6l6 6-6 6" /></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: GREEN }}>Run · Python, JavaScript, Java, C++, TypeScript, PHP</span>
              </div>
            </div>
            <div style={{ order: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--tint-green)', borderRadius: 999, padding: '7px 14px', marginBottom: 18 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN }} /><span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: '#5a7a2a' }}>Code &amp; run</span></div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.15 }}>Write and run real code in the browser</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.65, color: '#6b6455', margin: '0 0 22px' }}>A full Monaco editor with instant execution — no install. Students write their solution, run it, and get results in seconds, with Solve AI on hand to explain any error.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-secondary)' }}><Check />6 languages, zero install</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-secondary)' }}><Check />Instant execution with Solve AI error help</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ================= PRICING ================= */}
      <div id="pricing" style={{ maxWidth: 1180, margin: '120px auto 0', padding: '0 40px', textAlign: 'center' }}>
        <Reveal><div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', color: GREEN, marginBottom: 14 }}>Pricing</div></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 44, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '0 auto 18px', maxWidth: 640, lineHeight: 1.1 }}>Simple, transparent pricing</h2></Reveal>
        <Reveal delay={0.1}><p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: '#6b6455', margin: '0 auto', maxWidth: 560 }}>Free to get started — upgrade when you need more.</p></Reveal>
      </div>

      <div style={{ maxWidth: 1180, margin: '56px auto 0', padding: '0 40px', display: 'grid', gridTemplateColumns: '1fr 1.08fr 1fr', gap: 26, alignItems: 'center' }}>
        <Reveal>
          <div className="ss-price-card" style={{ background: '#fff', borderRadius: 24, padding: '38px 30px', border: '1px solid #f0eef6', boxShadow: '0 34px 70px -40px rgba(20,20,39,0.32)', textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--tint-indigo)', borderRadius: 999, padding: '6px 13px', marginBottom: 18 }}><span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--navy)' }}>Free forever</span></div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Student</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em', color: 'var(--ink)' }}>0 MAD</span></div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#a49b88', marginBottom: 26 }}>Forever free</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {['Join unlimited sessions', 'Write and run code in 6 languages', 'AI Coding Assistant (20 messages/day)', 'PDF Simplifier (3 PDFs/month)', 'Access course materials shared by professors', 'View quiz results and leaderboard'].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4, color: 'var(--ink-secondary)' }}><Check />{t}</li>
              ))}
            </ul>
            <Link to="/register" className="ss-click" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--navy)', textDecoration: 'none', padding: 14, borderRadius: 12, border: '1.5px solid var(--navy)' }}>Get Started Free</Link>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="ss-price-card" style={{ background: 'linear-gradient(160deg,#1e3a8a,#2c53ab)', borderRadius: 26, padding: '42px 32px', boxShadow: '0 50px 100px -34px rgba(30,58,138,0.6)', textAlign: 'left', transform: 'scale(1.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(137,197,64,0.28),transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: GREEN, borderRadius: 999, padding: '6px 14px', marginBottom: 18, animation: 'ss-badgepulse 2.4s ease-in-out infinite' }}><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, color: '#12331a' }}>★ Most popular</span></div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 6 }}>Professor Premium</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 44, letterSpacing: '-0.02em', color: '#fff' }}>99 MAD</span></div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginBottom: 26 }}>per month — cancel anytime</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                {['Unlimited sessions', 'Unlimited students per session', 'Unlimited AI Quiz Generation', 'Unlimited PDF Simplifier', 'Course Drive (10 GB storage)', 'Full exam security (disable AI, copy-paste, tab monitoring)', 'Coding history recording', 'Live leaderboard for quizzes', 'Priority support'].map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4, color: 'rgba(255,255,255,0.92)' }}><Check />{t}</li>
                ))}
              </ul>
              <Link to="/register" className="ss-click" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--navy)', textDecoration: 'none', padding: 15, borderRadius: 12, background: '#fff', boxShadow: '0 16px 34px -14px rgba(0,0,0,0.4)' }}>Start Premium</Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="ss-price-card" style={{ background: '#fff', borderRadius: 24, padding: '38px 30px', border: '1px solid #f0eef6', boxShadow: '0 34px 70px -40px rgba(20,20,39,0.32)', textAlign: 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--tint-green)', borderRadius: 999, padding: '6px 13px', marginBottom: 18 }}><span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#5a7a2a' }}>Free to try</span></div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', marginBottom: 6 }}>Professor</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 40, letterSpacing: '-0.02em', color: 'var(--ink)' }}>0 MAD</span></div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#a49b88', marginBottom: 26 }}>Free trial — no credit card</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {['3 sessions per month', 'Up to 10 students per session', 'AI Quiz Generator (2 quizzes/month)', 'PDF Simplifier (3 PDFs/month)', 'Course Drive (500 MB storage)', 'Basic exam security flags'].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 11, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4, color: 'var(--ink-secondary)' }}><Check />{t}</li>
              ))}
            </ul>
            <Link to="/register" className="ss-click" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--navy)', textDecoration: 'none', padding: 14, borderRadius: 12, border: '1.5px solid var(--navy)' }}>Try For Free</Link>
          </div>
        </Reveal>
      </div>

      <div style={{ maxWidth: 640, margin: '34px auto 0', padding: '0 40px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.6, color: '#a49b88' }}>
        All plans include: Docker-secured code execution, email verification, and AI-powered error analysis.
      </div>

      {/* ================= FAQ ================= */}
      <div id="faq" style={{ maxWidth: 1180, margin: '120px auto 0', padding: '0 40px', textAlign: 'center' }}>
        <Reveal><div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase', color: GREEN, marginBottom: 14 }}>FAQ</div></Reveal>
        <Reveal delay={0.05}><h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 44, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '0 auto 18px', maxWidth: 640, lineHeight: 1.1 }}>Frequently asked questions</h2></Reveal>
        <Reveal delay={0.1}><p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: '#6b6455', margin: '0 auto', maxWidth: 560 }}>Everything you need to know about SmartStudy.</p></Reveal>
      </div>

      <div style={{ maxWidth: 820, margin: '48px auto 0', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {faqs.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
        ))}
      </div>

      {/* ================= CTA BAND ================= */}
      <div style={{ maxWidth: 1180, margin: '120px auto 0', padding: '0 40px' }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#1e3a8a,#2c53ab 55%,#3a63c4)', borderRadius: 30, padding: '72px 40px', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -80, left: '8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(137,197,64,0.3),transparent 70%)', animation: 'ss-float 9s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: -100, right: '6%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(185,168,255,0.25),transparent 70%)', animation: 'ss-float2 11s ease-in-out infinite' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 42, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Ready to learn smarter,<br />not harder?</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', margin: '0 auto 32px', maxWidth: 480 }}>Join thousands of classrooms already teaching, coding and quizzing on SmartStudy. Free to start — no card required.</p>
              <Link to="/register" className="ss-click" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--navy)', textDecoration: 'none', padding: '18px 34px', borderRadius: 14, background: '#fff', boxShadow: '0 18px 40px -16px rgba(0,0,0,0.5)' }}>
                Get Started for Free
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="M12 6l6 6-6 6" /></svg>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ================= FOOTER ================= */}
      <footer style={{ maxWidth: 1180, margin: '72px auto 0', padding: '40px 40px 56px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Logo size={34} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>SmartStudy</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#a49b88' }}>Learn Smarter, Not Harder.</div>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#a49b88' }}>© 2026 SmartStudy · By Power Rangers Team</div>
      </footer>
    </div>
  );
}
