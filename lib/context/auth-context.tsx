"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  LoginCredentials,
  RegisterData,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getCurrentUser,
  getStoredUser,
  isAuthenticated,
  switchTenant as authSwitchTenant,
  clearAuthData,
  bootstrapTabSession,
} from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state + bootstrap per-tab session
  useEffect(() => {
    // Bootstrap: if new tab, copy auth from localStorage to sessionStorage
    bootstrapTabSession();

    const initAuth = async () => {
      try {
        // Check if we have stored auth data (sessionStorage first, then localStorage)
        if (isAuthenticated()) {
          // Sync cookie from sessionStorage/localStorage to ensure middleware passes
          const token = sessionStorage.getItem('maos_access_token') || localStorage.getItem('maos_access_token');
          if (token) {
            document.cookie = `maos_access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          }

          // Try to get user from storage first (sessionStorage prioritized)
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }

          // Then refresh from API
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token invalid, clear auth
            clearAuthData();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Cross-tab logout detection: if another tab clears localStorage, logout here too
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Another tab removed the access token → global logout
      if (event.key === 'maos_access_token' && event.newValue === null) {
        // Clear this tab's session too
        sessionStorage.removeItem('maos_access_token');
        sessionStorage.removeItem('maos_refresh_token');
        sessionStorage.removeItem('maos_user');
        document.cookie = 'maos_access_token=; path=/; max-age=0; SameSite=Lax';
        setUser(null);
        router.push('/login');
      }
      // Note: we intentionally DO NOT react to token changes (new login in another tab)
      // Each tab keeps its own session via sessionStorage
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authLogin(credentials);
      if (response.data?.user) {
        setUser(response.data.user);
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await authRegister(data);
      // After registration, get the user profile
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authLogout();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      await authSwitchTenant(tenantId);
      // Refresh user to get updated tenant context
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Switch tenant error:', error);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    switchTenant,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
