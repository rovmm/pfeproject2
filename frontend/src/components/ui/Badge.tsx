import React from 'react'
import type { SessionStatus } from '../../types'

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'live'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  danger:  'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
  neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  live:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5
        text-xs font-medium rounded-full border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {variant === 'live' && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
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
