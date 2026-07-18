import { useBreadcrumb } from '../../layout/breadcrumb';
import Icon from '../../components/Icon';
import ScoreRing from '../../components/ScoreRing';
import LeaderboardTable from '../../components/LeaderboardTable';
import { leaderboard, quizResult } from '../../lib/mockData';

export default function QuizResults() {
  useBreadcrumb(['Chapter 4', 'Results']);
  const r = quizResult;

  return (
    <div style={{ padding: '28px 34px' }}>
      <div style={{ display: 'flex', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 30, flex: 1, minWidth: 340 }}>
          <ScoreRing pct={r.pct} correct={r.correct} total={r.total} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: 'var(--ink)', margin: '0 0 8px' }}>
              Great work, {r.studentName}!
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>
              You scored{' '}
              <b style={{ color: 'var(--success)' }}>
                {r.correct} out of {r.total}
              </b>
              . A couple of tricky ones on joins — review those and you'll ace the next one.
            </p>
          </div>
        </div>
        <div className="card" style={{ width: 230, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-muted)' }}>Time taken</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}>{r.timeTaken}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-muted)' }}>Class average</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink)' }}>{r.classAverage}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', margin: '0 0 14px' }}>Answer breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {r.breakdown.map((b) => (
              <div
                key={b.question}
                className="card"
                style={{ borderLeft: `3px solid ${b.correct ? 'var(--success)' : 'var(--error)'}`, padding: '13px 16px' }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{b.question}</div>
                <div style={{ fontSize: 12.5, color: b.correct ? 'var(--success)' : 'var(--error)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name={b.correct ? 'check' : 'x'} size={13} strokeWidth={2.4} /> Your answer: {b.yourAnswer}
                </div>
                {!b.correct && <div style={{ fontSize: 12.5, color: 'var(--success)', marginTop: 2 }}>Correct: {b.correctAnswer}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: 340 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', margin: '0 0 14px' }}>Leaderboard</h2>
          <LeaderboardTable entries={leaderboard} />
        </div>
      </div>
    </div>
  );
}
