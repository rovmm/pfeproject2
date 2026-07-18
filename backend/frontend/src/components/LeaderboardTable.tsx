import Icon from './Icon';

export type LeaderboardEntry = {
  initials: string;
  name: string;
  score: number;
  correctAnswers?: number;
  totalQuestions?: number;
  time?: string;
  isYou?: boolean;
  avatarBg?: string;
  avatarColor?: string;
};

function scoreColor(entry: LeaderboardEntry, index: number) {
  if (entry.isYou) return 'var(--navy)';
  if (index === 0) return 'var(--success)';
  return 'var(--ink)';
}

export default function LeaderboardTable({ entries, showMedals = false }: { entries: LeaderboardEntry[]; showMedals?: boolean }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {entries.map((e, i) => (
        <div key={e.name} className={`leaderboard-row ${e.isYou ? 'leaderboard-row-you' : ''}`}>
          <div
            className="avatar"
            style={{
              width: 28,
              height: 28,
              fontSize: 11,
              background: e.isYou ? undefined : e.avatarBg ?? 'var(--tint-indigo-strong)',
              color: e.isYou ? '#fff' : e.avatarColor ?? 'var(--blue-accent)',
            }}
          >
            {e.initials}
          </div>
          <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: e.isYou ? 700 : 600, color: e.isYou ? 'var(--navy)' : 'var(--ink)' }}>
            {showMedals && i < 3 && <Icon name="trophy" size={13} color="var(--star-gold)" />}
            {e.name}
            {e.isYou ? ' (you)' : ''}
          </span>
          {e.correctAnswers != null && e.totalQuestions != null && (
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
              {e.correctAnswers}/{e.totalQuestions}
            </span>
          )}
          {e.time && <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{e.time}</span>}
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13.5, color: scoreColor(e, i) }}>{e.score}%</span>
        </div>
      ))}
    </div>
  );
}
