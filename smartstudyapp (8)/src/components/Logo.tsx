let gradId = 0;

export default function Logo({
  size = 34,
  onDark = false,
  gradient = true,
}: {
  size?: number;
  onDark?: boolean;
  gradient?: boolean;
}) {
  const id = `logo-grad-${(gradId += 1)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ flexShrink: 0 }}>
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e3a8a" />
            <stop offset="1" stopColor="#2c53ab" />
          </linearGradient>
        </defs>
      )}
      <rect
        x="2"
        y="2"
        width="116"
        height="116"
        rx="32"
        fill={gradient ? `url(#${id})` : onDark ? 'rgba(255,255,255,0.16)' : 'var(--brand-gradient)'}
      />
      <path d="M28 44 L18 60 L28 76" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M92 44 L102 60 L92 76" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path
        d="M78 46 C78 37 67 34 57 34 C45 34 39 40 39 49 C39 65 82 57 82 74 C82 83 70 86 58 86 C48 86 41 83 37 77"
        stroke="#fff"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="88" cy="34" r="6.5" fill="#89c540" />
    </svg>
  );
}

export function Wordmark({ size = 19, color = 'var(--ink)' }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: size, letterSpacing: '-0.02em', color }}>
      SmartStudy
    </span>
  );
}
