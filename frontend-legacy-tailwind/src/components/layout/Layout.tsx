import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../Logo'
import Icon, { type IconName } from '../Icon'
import { useAuth } from '../../hooks/useAuth'

type NavItem = { label: string; path: string; icon: IconName; end?: boolean }

const NAV: Record<string, NavItem[]> = {
  PROF: [
    { label: 'Dashboard', path: '/professor/dashboard', icon: 'dashboard', end: true },
    { label: 'Éditeur de code', path: '/code-editor', icon: 'code' },
    { label: 'PDF Simplifier', path: '/pdf-simplifier', icon: 'file-text' },
  ],
  STUDENT: [
    { label: 'Dashboard', path: '/student/dashboard', icon: 'dashboard', end: true },
    { label: 'Éditeur de code', path: '/code-editor', icon: 'code' },
    { label: 'PDF Simplifier', path: '/pdf-simplifier', icon: 'file-text' },
  ],
  ADMIN: [
    { label: 'Administration', path: '/admin/dashboard', icon: 'panel', end: true },
    { label: 'Éditeur de code', path: '/code-editor', icon: 'code' },
    { label: 'PDF Simplifier', path: '/pdf-simplifier', icon: 'file-text' },
  ],
}

const roleLabel: Record<string, string> = { PROF: 'Professeur', STUDENT: 'Étudiant', ADMIN: 'Administrateur' }

export function Layout() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  if (!currentUser) return null
  const items = NAV[currentUser.role] ?? NAV.STUDENT

  const initials = currentUser.fullName
    ? currentUser.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const activeItem = items.find((item) => (item.end ? pathname === item.path : pathname.startsWith(item.path)))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--page-bg)' }}>
      <aside
        style={{
          width: collapsed ? 64 : 240,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
          padding: collapsed ? '20px 0' : '20px 16px',
          transition: 'width 0.15s ease',
        }}
      >
        {collapsed ? (
          <Logo size={34} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 6px 20px' }}>
            <Logo size={34} />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              SmartStudy
            </span>
            <span onClick={() => setCollapsed(true)} style={{ marginLeft: 'auto', color: '#aa9f88', fontSize: 16, cursor: 'pointer' }}>
              <Icon name="chevron-left" size={16} />
            </span>
          </div>
        )}
        {!collapsed && (
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-placeholder)', padding: '6px 10px 8px' }}>
            {(roleLabel[currentUser.role] ?? currentUser.role).toUpperCase()}
          </div>
        )}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: collapsed ? 8 : 3, alignItems: collapsed ? 'center' : 'stretch', marginTop: collapsed ? 16 : 0 }}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={collapsed ? item.label : undefined}
              style={({ isActive }) =>
                collapsed
                  ? {
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: isActive ? 'var(--tint-indigo)' : 'transparent',
                      color: isActive ? 'var(--navy)' : 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }
                  : {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 12px',
                      borderRadius: 11,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--navy)' : 'var(--ink-secondary)',
                      background: isActive ? 'var(--tint-indigo)' : 'transparent',
                      textDecoration: 'none',
                    }
              }
            >
              <span style={{ width: 20, textAlign: 'center' }}>
                <Icon name={item.icon} size={16} />
              </span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? 0 : '11px 10px',
            borderTop: collapsed ? 'none' : '1px solid var(--surface-muted)',
          }}
        >
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
            {initials}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{roleLabel[currentUser.role] ?? currentUser.role}</div>
            </div>
          )}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 26px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {collapsed && (
            <span onClick={() => setCollapsed(false)} style={{ color: '#aa9f88', fontSize: 17, cursor: 'pointer' }}>
              <Icon name="chevron-right" size={17} />
            </span>
          )}
          <div style={{ fontSize: 13.5, color: 'var(--ink-muted)' }}>
            <span>{roleLabel[currentUser.role] ?? currentUser.role}</span>
            {activeItem && (
              <span>
                <span style={{ color: '#cabfa8', margin: '0 6px' }}>/</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{activeItem.label}</span>
              </span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-secondary)',
              }}
            >
              <Icon name="bell" size={16} />
            </button>
            <div
              onClick={() => setAvatarOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '5px 12px 5px 6px',
                border: '1px solid var(--border)',
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                {initials}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{currentUser.fullName?.split(' ')[0]}</span>
              <Icon name="chevron-down" size={11} style={{ color: '#aa9f88' }} />
            </div>
            {avatarOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-card)',
                  minWidth: 160,
                  overflow: 'hidden',
                  zIndex: 30,
                }}
              >
                <div
                  onClick={handleLogout}
                  style={{ padding: '11px 16px', fontSize: 13.5, fontWeight: 600, color: 'var(--error-strong)', cursor: 'pointer' }}
                >
                  Déconnexion
                </div>
              </div>
            )}
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
