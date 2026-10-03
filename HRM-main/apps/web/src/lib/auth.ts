import { create } from 'zustand';

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    avatarUrl?: string;
    departmentId: string;
  };
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;

  setAuth: (user: UserInfo, accessToken: string, refreshToken: string) => void;
  setUser: (user: UserInfo) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setMustChangePassword: (must: boolean) => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,
  mustChangePassword: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
    });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      mustChangePassword: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setMustChangePassword: (must) => set({ mustChangePassword: must }),

  hasPermission: (resource: string, action: string) => {
    const { user } = get();
    if (!user) return false;
    // Admin has all permissions except payroll
    if (user.role === 'ADMIN' && resource !== 'payroll') return true;
    // CEO can read everything
    if (user.role === 'CEO' && action === 'read') return true;
    return user.permissions.includes(`${resource}:${action}`);
  },

  hasAnyPermission: (permissions: string[]) => {
    const { user } = get();
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
  },
}));
