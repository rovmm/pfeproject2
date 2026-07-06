function colorForScore(pct: number) {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 60) return 'var(--blue-accent)';
  if (pct >= 40) return 'var(--amber-strong)';
  return 'var(--error-strong)';
}

export default function ScoreRing({
  pct,
  correct,
  total,
  size = 132,
  innerSize = 104,
}: {
  pct: number;
  correct: number;
  total: number;
  size?: number;
  innerSize?: number;
}) {
  const color = colorForScore(pct);
  const turn = Math.max(0, Math.min(1, pct / 100));
  return (
    <div
      className="score-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0turn ${turn}turn, #eef0f3 ${turn}turn 1turn)`,
      }}
    >
      <div className="score-ring-inner" style={{ width: innerSize, height: innerSize }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 30, color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 3 }}>
          {correct} / {total}
        </span>
      </div>
    </div>
  );
}
