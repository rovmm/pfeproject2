import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Code2, FileText, LogOut,
  BookOpen, GraduationCap, ChevronLeft, ChevronRight, X, Menu,
  Shield,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

const profNav: NavItem[] = [
  { to: '/professor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/code-editor',         icon: <Code2 size={18} />,           label: 'Éditeur de code' },
  { to: '/pdf-simplifier',      icon: <FileText size={18} />,        label: 'PDF Simplifier' },
]

const studentNav: NavItem[] = [
  { to: '/student/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/code-editor',        icon: <Code2 size={18} />,           label: 'Éditeur de code' },
  { to: '/pdf-simplifier',     icon: <FileText size={18} />,        label: 'PDF Simplifier' },
]

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', icon: <Shield size={18} />,          label: 'Administration' },
  { to: '/code-editor',      icon: <Code2 size={18} />,           label: 'Éditeur de code' },
  { to: '/pdf-simplifier',   icon: <FileText size={18} />,        label: 'PDF Simplifier' },
]

export function Sidebar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = currentUser?.role === 'PROF'
    ? profNav
    : currentUser?.role === 'ADMIN'
    ? adminNav
    : studentNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = currentUser?.role === 'PROF'
    ? 'Professeur'
    : currentUser?.role === 'ADMIN'
    ? 'Administrateur'
    : 'Étudiant'

  const RoleIcon = currentUser?.role === 'PROF'
    ? BookOpen
    : currentUser?.role === 'ADMIN'
    ? Shield
    : GraduationCap

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-4'} py-4 border-b border-[var(--color-border)]`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--color-text)] tracking-tight">SmartStudy</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <BookOpen size={14} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-500/10 border border-primary-500/20">
            <RoleIcon size={13} className="text-primary-500" />
            <span className="text-xs font-medium text-primary-500">{roleLabel}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-[var(--color-border)] space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-[var(--color-text)] truncate">{currentUser?.fullName}</p>
            <p className="text-xs text-[var(--color-muted)] truncate">{currentUser?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`sidebar-item w-full text-left ${collapsed ? 'justify-center px-2' : ''} hover:text-danger hover:bg-danger/10`}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text)] shadow-card"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed top-0 left-0 z-50 h-full w-60
          bg-[var(--color-sidebar)] border-r border-[var(--color-border)]
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-full z-30
          bg-[var(--color-sidebar)] border-r border-[var(--color-border)]
          transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
