import React from 'react'
import type { SessionStatus } from '../../types'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'live'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'badge-success',
  danger:  'badge-error',
  warning: 'badge-timeout',
  info:    'badge-quiz',
  neutral: 'badge-closed',
  live:    'badge-quiz',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {variant === 'live' && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-[var(--info-text)] inline-block"
          style={{ animation: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
        />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === 'OPEN') return <Badge variant="success">OUVERTE</Badge>
  return <Badge variant="danger">FERMÉE</Badge>
}
