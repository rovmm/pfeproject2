import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import SessionTypeCard from '../../components/SessionTypeCard';
import LanguageSelector from '../../components/LanguageSelector';
import type { SessionType } from '../../lib/mockData';
import { toBackendLanguage, toProfessorDisplay } from '../../lib/sessionMapper';
import { sessionApi } from '../../api/session.api';
import { useToast } from '../../components/Toast';

export default function ProfessorDashboard() {
  useBreadcrumb(['Dashboard']);
  const navigate = useNavigate();
  const pushToast = useToast();
  const [creating, setCreating] = useState(true);
  const [type, setType] = useState<SessionType>('code');
  const [title, setTitle] = useState('Recursion warm-up');
  const [filiere, setFiliere] = useState('L2 Informatique');
  const [language, setLanguage] = useState('Python 3.11');
  const [prompt, setPrompt] = useState('Write a recursive factorial(n) function. Read n from stdin and print n!.');
  const [sessions, setSessions] = useState<ReturnType<typeof toProfessorDisplay>[]>([]);

  useEffect(() => {
    sessionApi
      .getMySessions()
      .then((data) => {
        setSessions(data.map(toProfessorDisplay));
        setCreating(data.length === 0);
      })
      .catch(() => pushToast('error', 'Could not load your sessions'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSession() {
    try {
      const created = await sessionApi.create({
        title,
        sessionType: type === 'code' ? 'CODE' : 'QUIZ',
        language: type === 'code' ? (toBackendLanguage(language) as any) : undefined,
        exercisePrompt: type === 'code' ? prompt : undefined,
        filiere,
      });
      setSessions((prev) => [toProfessorDisplay(created), ...prev]);
      pushToast('success', 'Session created');
      setCreating(false);
      if (type === 'quiz') navigate(`/professor/quiz-creator?sessionId=${created.id}`);
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not create session');
    }
  }

  return (
    <div style={{ padding: '26px 34px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: 0 }}>Your sessions</h1>
        {!creating && (
          <Button variant="primary" size="sm" style={{ marginLeft: 'auto' }} onClick={() => setCreating(true)}>
            + Create Session
          </Button>
        )}
      </div>

      {creating && (
        <div className="card" style={{ padding: 24, marginBottom: 26, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', marginBottom: 16 }}>Create a new session</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <SessionTypeCard
              icon="code"
              title="Code"
              description="Exercise prompt + language"
              selected={type === 'code'}
              onClick={() => setType('code')}
            />
            <SessionTypeCard
              icon="lightbulb"
              title="Quiz"
              description="MCQ, manual or AI"
              selected={type === 'quiz'}
              onClick={() => setType('quiz')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="field-label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Filière (class)</label>
              <input className="input" value={filiere} onChange={(e) => setFiliere(e.target.value)} />
            </div>
          </div>
          {type === 'code' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Language</label>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label className="field-label">Exercise prompt</label>
                <textarea className="input" style={{ height: 70, resize: 'none' }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </div>
            </>
          )}
          {type === 'quiz' && (
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 18 }}>
              You'll add questions in the Quiz Creator after creating this session.
            </p>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={createSession}>
              {type === 'code' ? 'Create & get code' : 'Create & add questions'}
            </Button>
            <Button variant="secondary" style={{ border: '1.5px solid var(--border-input)', color: 'var(--ink-muted)' }} onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
        {sessions.map((s) => (
          <div key={s.id} className="card card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Badge kind={s.status}>{s.status.toUpperCase()}</Badge>
              <span className="badge badge-chip" style={{ color: 'var(--ink-secondary)', background: 'var(--surface-muted)' }}>
                {s.filiere}
              </span>
              <Badge kind={s.type === 'code' ? 'python' : 'quiz'}>{s.type === 'code' ? s.language : 'QUIZ'}</Badge>
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{s.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 26,
                  letterSpacing: '0.14em',
                  color: 'var(--navy)',
                  background: '#eef3fb',
                  border: '1px dashed var(--border-dashed)',
                  borderRadius: 12,
                  padding: '8px 18px',
                }}
              >
                {s.joinCode}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ border: '1px solid var(--border)' }}
                onClick={() => {
                  navigator.clipboard?.writeText(s.joinCode);
                  pushToast('info', 'Code copied');
                }}
              >
                <Icon name="copy" size={13} /> Copy
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-muted)' }}>
              <Icon name="user-check" size={15} /> {s.studentsJoined} students joined
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button
                variant="secondary"
                size="sm"
                full
                onClick={() => navigate(s.type === 'code' ? `/professor/session/${s.id}/code` : `/professor/session/${s.id}/quiz`)}
              >
                Open live view
              </Button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-alt)', color: 'var(--ink-secondary)' }}
                onClick={() => pushToast('info', 'Session duplicated — edit the class name to reuse it')}
              >
                <Icon name="copy" size={13} /> Duplicate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
