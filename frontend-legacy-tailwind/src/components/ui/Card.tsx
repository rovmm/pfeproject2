import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm:   'card-pad !p-3',
  md:   'card-pad',
  lg:   'card-pad !p-6',
}

export function Card({ children, className = '', hover = true, padding = 'md', ...rest }: CardProps) {
  return (
    <div
      className={`
        card
        ${paddingClasses[padding]}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)] tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
