import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import EmptyState from '../../components/EmptyState';
import { SkeletonTableRow } from '../../components/Skeleton';
import LeaderboardTable, { type LeaderboardEntry } from '../../components/LeaderboardTable';
import { useToast } from '../../components/Toast';
import { sessionApi } from '../../api/session.api';
import { quizApi } from '../../api/quiz.api';
import { toProfessorDisplay } from '../../lib/sessionMapper';
import type { LeaderboardEntry as BackendLeaderboardEntry, QuizAttemptResponse, QuizResponse } from '../../types';

type Tab = 'leaderboard' | 'detailed' | 'preview';

type ProfessorSession = ReturnType<typeof toProfessorDisplay>;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function toEntry(e: BackendLeaderboardEntry): LeaderboardEntry {
  return {
    initials: initials(e.studentName),
    name: e.studentName,
    score: Math.round(e.percentage),
    correctAnswers: e.score,
    totalQuestions: e.totalQuestions,
    time: fmtTime(e.completedAt),
  };
}

export default function ProfessorQuizSessionLive() {
  const { id } = useParams();
  const pushToast = useToast();
  const [session, setSession] = useState<ProfessorSession | null>(null);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [entries, setEntries] = useState<BackendLeaderboardEntry[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [attempts, setAttempts] = useState<QuizAttemptResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [openStudent, setOpenStudent] = useState<number | null>(null);

  useBreadcrumb(['Sessions', session?.title ?? '']);

  useEffect(() => {
    if (!id) return;
    sessionApi
      .getById(Number(id))
      .then((s) => setSession(toProfessorDisplay(s)))
      .catch(() => pushToast('error', 'Could not load session'));
    quizApi
      .getQuiz(Number(id))
      .then(setQuiz)
      .catch(() => pushToast('error', 'Could not load quiz'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const sessionId = Number(id);
    let cancelled = false;

    function poll() {
      Promise.all([quizApi.getLeaderboard(sessionId), quizApi.getAttempts(sessionId)])
        .then(([board, atts]) => {
          if (cancelled) return;
          setEntries(board.entries);
          setTotalStudents(board.totalStudents);
          setAttempts(atts);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  async function closeSession() {
    if (!id) return;
    try {
      await sessionApi.close(Number(id));
      setSession((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      pushToast('info', 'Session closed');
    } catch (err: any) {
      pushToast('error', err.response?.data?.message || 'Could not close the session');
    }
  }

  if (!session) return null;

  const completedCount = entries.length;
  const averageScore = completedCount === 0 ? 0 : Math.round(entries.reduce((sum, e) => sum + e.percentage, 0) / completedCount);
  const leaderboardEntries = entries.map(toEntry);
  const questionCount = quiz?.questionCount ?? 0;
  const duration = quiz?.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : 'No time limit';

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
            {session.filiere} · {questionCount} questions · {duration}
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 10, textAlign: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--ink)' }}>{totalStudents}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Joined</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--success)' }}>{completedCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Finished</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--navy)' }}>{averageScore}%</div>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Avg</div>
          </div>
        </div>
        <button
          className="btn btn-danger"
          style={{ marginTop: 'auto' }}
          disabled={session.status === 'closed'}
          onClick={closeSession}
        >
          {session.status === 'closed' ? 'Session closed' : 'Close session'}
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
          {loading ? (
            <div className="card">
              <SkeletonTableRow />
              <SkeletonTableRow />
              <SkeletonTableRow />
            </div>
          ) : (
            <>
              {tab === 'leaderboard' &&
                (leaderboardEntries.length === 0 ? (
                  <EmptyState
                    icon={<Icon name="trophy" size={26} />}
                    title="No quiz submissions yet."
                    message="Once students submit the quiz, their ranking will show up here."
                  />
                ) : (
                  <LeaderboardTable entries={leaderboardEntries} showMedals />
                ))}

              {tab === 'detailed' &&
                (attempts.length === 0 ? (
                  <EmptyState
                    icon={<Icon name="bar-chart" size={26} />}
                    title="No quiz submissions yet."
                    message="Once students submit the quiz, their answer breakdown will show up here."
                  />
                ) : (
                  attempts
                    .slice()
                    .sort((a, b) => b.percentage - a.percentage || new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
                    .map((a) => (
                      <div key={a.studentId} className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                        <div
                          onClick={() => setOpenStudent(openStudent === a.studentId ? null : a.studentId)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
                        >
                          <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                            {initials(a.studentName)}
                          </div>
                          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{a.studentName}</span>
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                            {Math.round(a.percentage)}%
                          </span>
                          <Icon name={openStudent === a.studentId ? 'chevron-up' : 'chevron-down'} size={14} style={{ color: 'var(--ink-muted)' }} />
                        </div>
                        {openStudent === a.studentId && (
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
                (quiz?.questions ?? []).map((q, i) => (
                  <div key={q.id} className="card card-pad" style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', marginBottom: 10 }}>
                      {i + 1}. {q.questionText}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(
                        [
                          ['A', q.optionA],
                          ['B', q.optionB],
                          ['C', q.optionC],
                          ['D', q.optionD],
                        ] as const
                      ).map(([letter, text]) => (
                        <div
                          key={letter}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 13,
                            color: letter === q.correctOption ? 'var(--success)' : 'var(--ink-secondary)',
                            fontWeight: letter === q.correctOption ? 600 : 400,
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: letter === q.correctOption ? 'var(--success-bg)' : 'var(--surface-muted)',
                              color: letter === q.correctOption ? 'var(--success)' : 'var(--ink-secondary)',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {letter}
                          </span>
                          {text}
                          {letter === q.correctOption && <Icon name="check" size={13} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
