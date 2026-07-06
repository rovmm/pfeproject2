import type { ReactNode } from 'react'
import { Logo } from './Logo'
import Icon from './Icon'

export function AuthBrandPanel({
  width = 440,
  heading,
  body,
  features,
}: {
  width?: number
  heading: string
  body?: ReactNode
  features: string[]
}) {
  return (
    <div
      style={{
        width,
        flexShrink: 0,
        background: 'linear-gradient(150deg,var(--navy),var(--navy-light))',
        padding: '52px 46px',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -90, right: -90 }} />
      <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: 20, left: -60 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative' }}>
        <Logo size={40} onDark gradient={false} />
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22 }}>SmartStudy</span>
      </div>
      <div style={{ marginTop: 'auto', position: 'relative' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          {heading}
        </h2>
        {body && <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', margin: 0 }}>{body}</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map((f) => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
              <Icon name="check" size={16} strokeWidth={2.6} style={{ color: '#89c540' }} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
