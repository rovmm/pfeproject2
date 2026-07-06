import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import LeaderboardTable from '../../components/LeaderboardTable';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import { quizApi } from '../../api/quiz.api';
import type { SessionResponse, LeaderboardResponse, QuizAttemptResponse, QuizResponse } from '../../types';
import { SkeletonTableRow } from '../../components/Skeleton';

type Tab = 'leaderboard' | 'detailed' | 'preview';

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfessorQuizSessionLive() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptResponse[]>([]);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [openStudent, setOpenStudent] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const sessionId = Number(id);
    sessionApi.getById(sessionId).then(setSession).catch(() => pushToast('error', 'Could not load session'));
    quizApi.getLeaderboard(sessionId).then(setLeaderboard).catch(() => pushToast('error', 'Could not load leaderboard'));
    quizApi.getAttempts(sessionId).then(setAttempts).catch(() => {});
    quizApi.getQuiz(sessionId).then(setQuiz).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useBreadcrumb(['Sessions', session?.title ?? '…']);

  if (!session || !leaderboard) {
    return (
      <div style={{ padding: '22px 26px' }}>
        <SkeletonTableRow />
      </div>
    );
  }

  const avgPercentage = leaderboard.entries.length
    ? Math.round(leaderboard.entries.reduce((sum, e) => sum + e.percentage, 0) / leaderboard.entries.length)
    : 0;

  const questions = quiz?.questions ?? [];

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
            {session.filiere ? `${session.filiere} · ` : ''}
            {questions.length} questions
            {quiz?.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ''}
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{session.studentCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--success)' }}>{leaderboard.completedCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Finished</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>{avgPercentage}%</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Avg</div>
          </div>
        </div>
        <button
          className="btn btn-danger"
          style={{ marginTop: 'auto' }}
          onClick={() => {
            sessionApi
              .close(session.id)
              .then(() => pushToast('info', 'Session closed'))
              .catch(() => pushToast('error', 'Could not close session'));
          }}
        >
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
          {tab === 'leaderboard' && (
            leaderboard.entries.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: 20 }}>No submissions yet.</div>
            ) : (
              <LeaderboardTable
                entries={leaderboard.entries.map((e) => ({
                  initials: initialsOf(e.studentName),
                  name: e.studentName,
                  score: e.percentage,
                }))}
                showMedals
              />
            )
          )}

          {tab === 'detailed' &&
            (attempts.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: 20 }}>No attempts yet.</div>
            ) : (
              attempts.map((a) => (
                <div key={a.id} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                  <div
                    onClick={() => setOpenStudent(openStudent === a.id ? null : a.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
                  >
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                      {initialsOf(a.studentName)}
                    </div>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{a.studentName}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{Math.round(a.percentage)}%</span>
                    <Icon name={openStudent === a.id ? 'chevron-up' : 'chevron-down'} size={14} style={{ color: 'var(--ink-muted)' }} />
                  </div>
                  {openStudent === a.id && (
                    <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {a.answers.map((ans) => (
                        <div key={ans.questionId} style={{ fontSize: 12.5, color: 'var(--ink-secondary)', display: 'flex', gap: 8 }}>
                          <Icon name={ans.isCorrect ? 'check' : 'x'} size={13} style={{ color: ans.isCorrect ? 'var(--success)' : 'var(--error)' }} />
                          {ans.questionText}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ))}

          {tab === 'preview' &&
            (questions.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: 20 }}>No quiz questions yet.</div>
            ) : (
              questions.map((q, i) => {
                const options = [
                  { letter: 'A', text: q.optionA },
                  { letter: 'B', text: q.optionB },
                  { letter: 'C', text: q.optionC },
                  { letter: 'D', text: q.optionD },
                ];
                return (
                  <div key={q.id} className="card card-pad" style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', marginBottom: 10 }}>
                      {i + 1}. {q.questionText}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {options.map((o) => (
                        <div
                          key={o.letter}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 13,
                            color: o.letter === q.correctOption ? 'var(--success)' : 'var(--ink-secondary)',
                            fontWeight: o.letter === q.correctOption ? 600 : 400,
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: o.letter === q.correctOption ? 'var(--success-bg)' : 'var(--surface-muted)',
                              color: o.letter === q.correctOption ? 'var(--success)' : 'var(--ink-secondary)',
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
                          {o.letter === q.correctOption && <Icon name="check" size={13} />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ))}
        </div>
      </div>
    </div>
  );
}
