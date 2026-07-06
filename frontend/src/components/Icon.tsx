import type { CSSProperties } from 'react';

export type IconName =
  | 'dashboard'
  | 'code'
  | 'file-text'
  | 'clock'
  | 'bell'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'alert-triangle'
  | 'check'
  | 'grad-cap'
  | 'user-check'
  | 'user-single'
  | 'arrow-right'
  | 'lightbulb'
  | 'bar-chart'
  | 'play'
  | 'sparkles'
  | 'copy'
  | 'x'
  | 'trash'
  | 'search'
  | 'menu'
  | 'trophy'
  | 'panel'
  | 'x-circle'
  | 'info-circle'
  | 'chevron-up';

const paths: Record<IconName, { d: string[]; c?: { cx: number; cy: number; r: number }[]; filled?: boolean }> = {
  dashboard: { d: ['M4 11l8-7 8 7', 'M6 10v10h12V10'] },
  code: { d: ['M8 6l-5 6 5 6', 'M16 6l5 6-5 6'] },
  'file-text': { d: ['M14 3H6v18h12V8z', 'M14 3v5h5'] },
  clock: { d: ['M12 7v5l3 2', 'M9 2h6'], c: [{ cx: 12, cy: 13, r: 8 }] },
  bell: { d: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M10.5 21a2 2 0 0 0 3 0'] },
  'chevron-down': { d: ['M6 9l6 6 6-6'] },
  'chevron-up': { d: ['M6 15l6-6 6 6'] },
  'chevron-left': { d: ['M15 6l-6 6 6 6'] },
  'chevron-right': { d: ['M9 6l6 6-6 6'] },
  mail: { d: ['M3 7l9 6 9-6'], c: [] , },
  lock: { d: ['M8 11V7a4 4 0 0 1 8 0v4'] },
  eye: { d: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z'], c: [{ cx: 12, cy: 12, r: 3 }] },
  'alert-triangle': { d: ['M12 3l9 16H3z', 'M12 9v5', 'M12 17h.01'] },
  check: { d: ['M20 6L9 17l-5-5'] },
  'grad-cap': { d: ['M2 9l10-4 10 4-10 4z', 'M6 11v5c0 1.2 2.7 2 6 2s6-.8 6-2v-5'] },
  'user-check': { d: ['M4 20c0-4 4-6 8-6s8 2 8 6'], c: [{ cx: 12, cy: 8, r: 4 }] },
  'user-single': { d: ['M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5', 'M16 5.4a3.2 3.2 0 0 1 0 6.2'], c: [{ cx: 9, cy: 8, r: 3.4 }] },
  'arrow-right': { d: ['M5 12h13', 'M12 6l6 6-6 6'] },
  lightbulb: { d: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z'] },
  'bar-chart': { d: ['M4 20h16', 'M7 20v-6', 'M12 20v-10', 'M17 20v-4'] },
  play: { d: ['M7 5v14l12-7z'], filled: true },
  sparkles: { d: ['M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z'], filled: true },
  copy: { d: ['M5 15V5a2 2 0 0 1 2-2h8'] },
  x: { d: ['M6 6l12 12M18 6L6 18'] },
  trash: { d: ['M4 7h16', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'] },
  search: { d: ['M21 21l-4.3-4.3'], c: [{ cx: 11, cy: 11, r: 7 }] },
  menu: { d: ['M8 6h13M8 12h13M8 18h13', 'M3 6h.01M3 12h.01M3 18h.01'] },
  trophy: { d: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 6H5a3 3 0 0 0 3 3', 'M16 6h3a3 3 0 0 1-3 3', 'M10 15h4', 'M9 20h6', 'M12 15v5'] },
  panel: { d: ['M3 4h18v16H3z', 'M9 4v16'] },
  'x-circle': { d: ['M15 9l-6 6M9 9l6 6'], c: [{ cx: 12, cy: 12, r: 9 }] },
  'info-circle': { d: ['M12 11v5', 'M12 8h.01'], c: [{ cx: 12, cy: 12, r: 9 }] },
};

// copy icon needs an extra rect, handled specially
export default function Icon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}: {
  name: IconName;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}) {
  const spec = paths[name];
  const filled = spec.filled;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: '-0.14em', flexShrink: 0, ...style }}
    >
      {name === 'mail' && <rect x="3" y="5" width="18" height="14" rx="2" />}
      {name === 'lock' && <rect x="4" y="11" width="16" height="10" rx="2" />}
      {name === 'copy' && <rect x="9" y="9" width="11" height="11" rx="2" />}
      {spec.d.map((d) => (
        <path key={d} d={d} />
      ))}
      {spec.c?.map((c) => (
        <circle key={`${c.cx}-${c.cy}`} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
    </svg>
  );
}
