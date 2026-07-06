import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon, { type IconName } from '../components/Icon';
import { useAuth } from '../lib/auth';
import { BreadcrumbContext } from './breadcrumb';

type NavItem = { label: string; path: string; icon: IconName };

const NAV: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student', icon: 'dashboard' },
    { label: 'Code Editor', path: '/student/editor', icon: 'code' },
    { label: 'PDF Simplifier', path: '/student/pdf', icon: 'file-text' },
  ],
  professor: [
    { label: 'Dashboard', path: '/professor', icon: 'dashboard' },
    { label: 'My Sessions', path: '/professor/sessions', icon: 'menu' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'panel' },
  ],
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [segments, setSegments] = useState<string[]>(['Dashboard']);

  if (!user) return null;
  const items = NAV[user.role];

  return (
    <BreadcrumbContext.Provider value={{ setSegments }}>
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
              <span
                data-testid="sidebar-toggle"
                onClick={() => setCollapsed(true)}
                style={{ marginLeft: 'auto', color: '#aa9f88', fontSize: 16, cursor: 'pointer' }}
              >
                <Icon name="chevron-left" size={16} />
              </span>
            </div>
          )}
          {!collapsed && (
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-placeholder)', padding: '6px 10px 8px' }}>
              {user.role.toUpperCase()}
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: collapsed ? 8 : 3, alignItems: collapsed ? 'center' : 'stretch', marginTop: collapsed ? 16 : 0 }}>
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === `/${user.role}`}
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
              {user.initials}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{user.role}</div>
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
              <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
              {segments.map((seg) => (
                <span key={seg}>
                  <span style={{ color: '#cabfa8', margin: '0 6px' }}>/</span>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{seg}</span>
                </span>
              ))}
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
                data-testid="user-menu-trigger"
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
                  {user.initials}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{user.name.split(' ')[0]}</span>
                <Icon name="chevron-down" size={11} style={{ color: '#aa9f88' }} />
              </div>
              {avatarOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    background: '#fff',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-card)',
                    minWidth: 160,
                    overflow: 'hidden',
                    zIndex: 30,
                  }}
                >
                  <div
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    style={{ padding: '11px 16px', fontSize: 13.5, fontWeight: 600, color: 'var(--error-strong)', cursor: 'pointer' }}
                  >
                    Log out
                  </div>
                </div>
              )}
            </div>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  );
}
