'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AdminUserProfile, AuthCredentials, AuthStatus, AuthApiResponse } from '@/types/auth';

interface AuthContextType {
  user: AdminUserProfile | null;
  status: AuthStatus;
  error: string | null;
  isAdmin: boolean;
  login: (credentials: AuthCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'loading',
  error: null,
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = Boolean(user && user.role_names && user.role_names.some((r) => r.toLowerCase() === 'admin'));

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
      });

      if (res.ok) {
        const body: AuthApiResponse<AdminUserProfile & { is_admin: boolean }> = await res.json();
        if (body.is_success && body.data) {
          setUser(body.data);
          setStatus('authenticated');
          setError(null);
          return;
        }
      }

      setUser(null);
      setStatus('unauthenticated');
    } catch (err) {
      console.error('Failed to verify session:', err);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: AuthCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const body: AuthApiResponse<{ user?: AdminUserProfile }> = await res.json();

      if (!res.ok || !body.is_success) {
        const errMsg = body.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        setError(errMsg);
        if (res.status === 403) {
          setStatus('forbidden');
        } else {
          setStatus('unauthenticated');
        }
        return { success: false, message: errMsg };
      }

      await refreshSession();
      return { success: true, message: body.message };
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = 'Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.';
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      setError(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        isAdmin,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
