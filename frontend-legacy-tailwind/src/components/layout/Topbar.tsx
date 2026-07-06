import { useLocation } from 'react-router-dom'
import { Sun, Moon, Bell, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const breadcrumbLabels: Record<string, string> = {
  professor: 'Professeur',
  student:   'Étudiant',
  admin:     'Admin',
  dashboard: 'Dashboard',
  session:   'Session',
  'code-editor': 'Éditeur de code',
  'pdf-simplifier': 'PDF Simplifier',
}

function Breadcrumb() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
      <span className="text-[var(--color-text)] font-medium">SmartStudy</span>
      {parts.map((part, i) => {
        // Skip numeric IDs
        if (!isNaN(Number(part))) return null
        const label = breadcrumbLabels[part] ?? part
        const isLast = i === parts.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={12} className="opacity-50" />
            <span className={isLast ? 'text-[var(--color-text)] font-medium' : ''}>
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

export function Topbar() {
  const { currentUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header
      className="
        fixed top-0 right-0 z-20 flex items-center justify-between
        px-6 h-[60px]
        bg-[var(--color-sidebar)]/80 backdrop-blur-md
        border-b border-[var(--color-border)]
        transition-all duration-300
      "
      style={{ left: 'var(--sidebar-offset, 240px)' }}
    >
      {/* Left: breadcrumb */}
      <div className="hidden sm:block">
        <Breadcrumb />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="
            p-2 rounded-md text-[var(--color-muted)]
            hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40
            transition-all duration-200
          "
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification placeholder */}
        <button className="
          p-2 rounded-md text-[var(--color-muted)]
          hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40
          transition-all duration-200 relative
        ">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border)]">
          <div className="
            w-8 h-8 rounded-full bg-primary-500
            flex items-center justify-center
            text-xs font-semibold text-white
            ring-2 ring-primary-500/30
          ">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-[var(--color-text)] leading-tight">
              {currentUser?.fullName}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] leading-tight">
              {currentUser?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
