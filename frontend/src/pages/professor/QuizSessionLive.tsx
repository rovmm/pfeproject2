import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import LeaderboardTable from '../../components/LeaderboardTable';
import { professorSessions, leaderboard, quizQuestions } from '../../lib/mockData';
import { useToast } from '../../components/Toast';

type Tab = 'leaderboard' | 'detailed' | 'preview';

export default function ProfessorQuizSessionLive() {
  const { id } = useParams();
  const session = professorSessions.find((s) => s.id === id) ?? professorSessions[1];
  useBreadcrumb(['Sessions', session.title]);
  const pushToast = useToast();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [openStudent, setOpenStudent] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', gap: 20, padding: '22px 26px', height: '100%', minHeight: 0 }}>
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>JOIN CODE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: 'var(--navy)' }}>{session.joinCode}</div>
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: 14 }}
            onClick={() => {
              navigator.clipboard?.writeText(session.joinCode);
              pushToast('info', 'Code copied');
            }}
          >
            <Icon name="copy" size={14} /> Copy code
          </button>
        </div>
        <div className="card card-pad">
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>{session.title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            {session.filiere} · {quizQuestions.length} questions · 15 min
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{session.studentsJoined}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--success)' }}>27</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Finished</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>74%</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Avg</div>
          </div>
        </div>
        <button className="btn btn-danger" style={{ marginTop: 'auto' }} onClick={() => pushToast('info', 'Session closed')}>
          Close session
        </button>
      </div>

      <div className="card" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'flex', gap: 4, padding: 6, background: 'var(--surface-alt)', borderBottom: '1px solid var(--surface-muted)' }}>
          {(
            [
              ['leaderboard', 'trophy', 'Leaderboard'],
              ['detailed', 'bar-chart', 'Detailed Results'],
              ['preview', 'file-text', 'Quiz Preview'],
            ] as const
          ).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="btn btn-sm"
              style={{
                flex: 1,
                border: 'none',
                background: tab === key ? 'var(--surface)' : 'transparent',
                color: tab === key ? 'var(--navy)' : 'var(--ink-muted)',
                fontWeight: tab === key ? 700 : 600,
                boxShadow: tab === key ? '0 2px 8px -4px rgba(43,36,80,0.25)' : 'none',
              }}
            >
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {tab === 'leaderboard' && <LeaderboardTable entries={leaderboard} showMedals />}

          {tab === 'detailed' &&
            leaderboard.map((s) => (
              <div key={s.name} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => setOpenStudent(openStudent === s.name ? null : s.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
                >
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: s.avatarBg, color: s.avatarColor }}>
                    {s.initials}
                  </div>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{s.score}%</span>
                  <Icon name={openStudent === s.name ? 'chevron-up' : 'chevron-down'} size={14} style={{ color: 'var(--ink-muted)' }} />
                </div>
                {openStudent === s.name && (
                  <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {quizQuestions.map((q, i) => (
                      <div key={q.id} style={{ fontSize: 12.5, color: 'var(--ink-secondary)', display: 'flex', gap: 8 }}>
                        <Icon name={i % 4 !== 1 ? 'check' : 'x'} size={13} style={{ color: i % 4 !== 1 ? 'var(--success)' : 'var(--error)' }} />
                        {q.prompt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {tab === 'preview' &&
            quizQuestions.map((q, i) => (
              <div key={q.id} className="card card-pad" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', marginBottom: 10 }}>
                  {i + 1}. {q.prompt}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options.map((o) => (
                    <div
                      key={o.letter}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        color: o.letter === q.correct ? 'var(--success)' : 'var(--ink-secondary)',
                        fontWeight: o.letter === q.correct ? 600 : 400,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: o.letter === q.correct ? 'var(--success-bg)' : 'var(--surface-muted)',
                          color: o.letter === q.correct ? 'var(--success)' : 'var(--ink-secondary)',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {o.letter}
                      </span>
                      {o.text}
                      {o.letter === q.correct && <Icon name="check" size={13} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
