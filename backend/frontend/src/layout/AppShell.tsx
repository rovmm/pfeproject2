import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import Icon, { type IconName } from '../components/Icon';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useAiRestriction } from '../lib/aiRestriction';
import { BreadcrumbContext } from './breadcrumb';

type NavItem = { label: string; path: string; icon: IconName };

const NAV: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student', icon: 'dashboard' },
    { label: 'Code Editor', path: '/student/editor', icon: 'code' },
    { label: 'PDF Simplifier', path: '/student/pdf', icon: 'file-text' },
    { label: 'CodrDrive', path: '/student/drive', icon: 'folder' },
    { label: 'Solve', path: '/student/ai-assistant', icon: 'sparkles' },
  ],
  professor: [
    { label: 'Dashboard', path: '/professor', icon: 'dashboard' },
    { label: 'My Sessions', path: '/professor/sessions', icon: 'menu' },
    { label: 'CodrDrive', path: '/professor/drive', icon: 'folder' },
    { label: 'Solve', path: '/professor/ai-assistant', icon: 'sparkles' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'panel' },
  ],
};

export const AVATAR_UPDATED_EVENT = 'ss-avatar-updated';

function avatarKey(userId: number) {
  return `ss_avatar_${userId}`;
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { aiRestricted } = useAiRestriction();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [segments, setSegments] = useState<string[]>(['Dashboard']);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setAvatarUrl(localStorage.getItem(avatarKey(user.id)));

    const onAvatarUpdated = () => setAvatarUrl(localStorage.getItem(avatarKey(user.id)));
    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, [user?.id]);

  if (!user) return null;
  const items = NAV[user.role].filter((item) => !(aiRestricted && item.path.endsWith('/ai-assistant')));
  const canViewProfile = user.role === 'student' || user.role === 'professor';

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
                style={{ marginLeft: 'auto', color: 'var(--icon-muted)', fontSize: 16, cursor: 'pointer' }}
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
          <nav
            style={{ display: 'flex', flexDirection: 'column', gap: collapsed ? 8 : 3, alignItems: collapsed ? 'center' : 'stretch', marginTop: collapsed ? 16 : 0 }}
            onMouseLeave={() => setHoveredPath(null)}
          >
            {items.map((item) => (
              <div key={item.path} style={{ position: 'relative' }} onMouseEnter={() => setHoveredPath(item.path)}>
                <AnimatePresence>
                  {hoveredPath === item.path && (
                    <motion.div
                      layoutId="sidebar-hover-indicator"
                      className="sidebar-hover-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        layout: { type: 'spring', stiffness: 450, damping: 35 },
                        opacity: { duration: 0.12 },
                      }}
                      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                    />
                  )}
                </AnimatePresence>
                <NavLink
                  to={item.path}
                  end={item.path === `/${user.role}`}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) =>
                    collapsed
                      ? {
                          position: 'relative',
                          zIndex: 1,
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
                          position: 'relative',
                          zIndex: 1,
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
              </div>
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="avatar"
                style={{ width: 34, height: 34, objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                {user.initials}
              </div>
            )}
            {!collapsed && (
              <>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{user.role}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign out"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-muted)',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="log-out" size={16} />
                </button>
              </>
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
              <span onClick={() => setCollapsed(false)} style={{ color: 'var(--icon-muted)', fontSize: 17, cursor: 'pointer' }}>
                <Icon name="chevron-right" size={17} />
              </span>
            )}
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate(`/${user.role}`);
                }
              }}
              title="Go back"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-secondary)',
                flexShrink: 0,
              }}
            >
              <Icon name="arrow-left" size={15} />
            </button>
            <div style={{ fontSize: 13.5, color: 'var(--ink-muted)' }}>
              <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
              {segments.map((seg) => (
                <span key={seg}>
                  <span style={{ color: 'var(--divider-soft)', margin: '0 6px' }}>/</span>
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
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
              </button>
              <div
                data-testid="user-menu-trigger"
                onClick={() => canViewProfile && navigate(`/${user.role}/profile`)}
                title={canViewProfile ? 'View profile' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '5px 12px 5px 6px',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  cursor: canViewProfile ? 'pointer' : 'default',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="avatar"
                    style={{ width: 30, height: 30, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                    {user.initials}
                  </div>
                )}
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{user.name.split(' ')[0]}</span>
              </div>
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
