import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Role = 'student' | 'professor' | 'admin';

export type User = {
  name: string;
  initials: string;
  email: string;
  role: Role;
};

const DEMO_USERS: Record<Role, User> = {
  student: { name: 'Léa Moreau', initials: 'LM', email: 'lea.moreau@univ-lyon.fr', role: 'student' },
  professor: { name: 'M. Diallo', initials: 'MD', email: 'm.diallo@univ-lyon.fr', role: 'professor' },
  admin: { name: 'Admin', initials: 'AD', email: 'admin@smartstudy.io', role: 'admin' },
};

const STORAGE_KEY = 'smartstudy-session';

function readStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (role: Role) => {
        const u = DEMO_USERS[role];
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        setUser(u);
      },
      logout: () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
