import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';

export type Role = 'student' | 'professor' | 'admin';
export type BackendRole = 'STUDENT' | 'PROF' | 'ADMIN';

export type User = {
  id: number;
  name: string;
  initials: string;
  email: string;
  role: Role;
  plan?: string;
};

const TOKEN_KEY = 'ss_token';
const USER_KEY = 'ss_user';

function backendToRole(role: BackendRole): Role {
  if (role === 'PROF') return 'professor';
  if (role === 'ADMIN') return 'admin';
  return 'student';
}

function roleToBackend(role: Extract<Role, 'student' | 'professor'>): BackendRole {
  return role === 'professor' ? 'PROF' : 'STUDENT';
}

function initialsOf(fullName: string) {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  user: User | null;
  loginWithCredentials: (email: string, password: string) => Promise<User>;
  registerWithCredentials: (
    fullName: string,
    email: string,
    password: string,
    role: Extract<Role, 'student' | 'professor'>,
  ) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const applyAuthResponse = (res: { token: string; id: number; fullName: string; email: string; role: string; plan?: string }) => {
    const u: User = {
      id: res.id,
      name: res.fullName,
      initials: initialsOf(res.fullName),
      email: res.email,
      role: backendToRole(res.role as BackendRole),
      plan: res.plan,
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loginWithCredentials: async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        return applyAuthResponse(res);
      },
      registerWithCredentials: async (fullName, email, password, role) => {
        const res = await authApi.register({ fullName, email, password, role: roleToBackend(role) });
        return applyAuthResponse(res);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
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
