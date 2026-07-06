import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import ScoreRing from '../../components/ScoreRing';
import LeaderboardTable from '../../components/LeaderboardTable';
import { SkeletonTableRow } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { quizApi } from '../../api/quiz.api';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import type { LeaderboardResponse, QuizAttemptResponse } from '../../types';

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function QuizResults() {
  const { id } = useParams();
  const { user } = useAuth();
  const pushToast = useToast();
  useBreadcrumb(['Sessions', 'Results']);
  const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`quiz-attempt-${id}`);
    if (stored) {
      try {
        setAttempt(JSON.parse(stored));
      } catch {
        // ignore malformed cache
      }
    }
    quizApi
      .getLeaderboard(Number(id))
      .then(setLeaderboard)
      .catch(() => pushToast('error', 'Could not load leaderboard'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '28px 34px' }}>
        <SkeletonTableRow />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div style={{ padding: '28px 34px' }}>
        <EmptyState
          icon={<Icon name="bar-chart" size={26} />}
          title="No result to show"
          message="Take the quiz to see your score and the leaderboard here."
        />
      </div>
    );
  }

  const classAverage = leaderboard?.entries.length
    ? Math.round(leaderboard.entries.reduce((sum, e) => sum + e.percentage, 0) / leaderboard.entries.length)
    : 0;

  return (
    <div style={{ padding: '28px 34px' }}>
      <div style={{ display: 'flex', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 30, flex: 1, minWidth: 340 }}>
          <ScoreRing pct={Math.round(attempt.percentage)} correct={attempt.score} total={attempt.totalQuestions} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: '0 0 8px' }}>
              Great work, {user?.name ?? attempt.studentName}!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>
              You scored{' '}
              <b style={{ color: 'var(--success)' }}>
                {attempt.score} out of {attempt.totalQuestions}
              </b>
              .
            </p>
          </div>
        </div>
        <div className="card" style={{ width: 230, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-muted)' }}>Class average</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}>{classAverage}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', margin: '0 0 14px' }}>Answer breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {attempt.answers.map((b) => (
              <div
                key={b.questionId}
                className="card"
                style={{ borderLeft: `3px solid ${b.isCorrect ? 'var(--success)' : 'var(--error)'}`, padding: '13px 16px' }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{b.questionText}</div>
                <div style={{ fontSize: 12.5, color: b.isCorrect ? 'var(--success)' : 'var(--error)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name={b.isCorrect ? 'check' : 'x'} size={13} strokeWidth={2.4} /> Your answer: {b.selectedOption}
                </div>
                {!b.isCorrect && <div style={{ fontSize: 12.5, color: 'var(--success)', marginTop: 2 }}>Correct: {b.correctOption}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 340 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', margin: '0 0 14px' }}>Leaderboard</h2>
          {leaderboard && leaderboard.entries.length > 0 ? (
            <LeaderboardTable
              entries={leaderboard.entries.map((e) => ({
                initials: initialsOf(e.studentName),
                name: e.studentName,
                score: e.percentage,
                isYou: !!user && e.studentEmail === user.email,
              }))}
            />
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No leaderboard entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
