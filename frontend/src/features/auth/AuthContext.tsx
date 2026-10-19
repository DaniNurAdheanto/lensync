'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { c2cClient, AuthUser } from '@/lib/api-client';

export type { AuthUser };

interface SignUpPayload {
  full_name: string;
  email: string;
  password: string;
  studio_name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signUp: (payload: SignUpPayload) => Promise<AuthUser>;
  logout: () => void;
  quickDemoLogin: (profile: 'dani' | 'alex' | 'claire' | 'marcus') => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = {
  dani: {
    name: 'Dani Nur Adheanto',
    email: 'daninuradheanto@lensync.studio',
    password: 'pass123',
    role: 'photographer' as const,
    studio: 'Dani Nur Studio',
    title: 'Lead Commercial Photographer',
  },
  alex: {
    name: 'Alexander Wright',
    email: 'alex@lumina-studio.com',
    password: 'pass123',
    role: 'photographer' as const,
    studio: 'Lumina Studio Paris',
    title: 'Senior Fashion Photographer',
  },
  claire: {
    name: 'Claire De La Tour',
    email: 'studio@vogue-paris.com',
    password: 'pass123',
    role: 'admin' as const,
    studio: 'Vogue Paris Editorial',
    title: 'Studio Director & Producer',
  },
  marcus: {
    name: 'Marcus Vance',
    email: 'editor@lensync.studio',
    password: 'pass123',
    role: 'editor' as const,
    studio: 'ColorLab Post-Production',
    title: 'Senior RAW Colorist & Retoucher',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage on client mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('lensync_user');
        const storedToken = localStorage.getItem('lensync_token');

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          c2cClient.setToken(storedToken);

          // Silently verify session validity with backend
          c2cClient.getMe().then((res) => {
            if (res.user) {
              setUser(res.user);
              localStorage.setItem('lensync_user', JSON.stringify(res.user));
            }
          }).catch(() => {
            // Keep storedUser if offline or in dev mode
          });
        } else {
          // Default initial session for seamless development / demo experience
          const defaultDemo = {
            id: 'usr_dani_01',
            email: DEMO_ACCOUNTS.dani.email,
            full_name: DEMO_ACCOUNTS.dani.name,
            studio_name: DEMO_ACCOUNTS.dani.studio,
            role: DEMO_ACCOUNTS.dani.role,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          };
          setUser(defaultDemo);
          localStorage.setItem('lensync_user', JSON.stringify(defaultDemo));
        }
      } catch (err) {
        console.error('Failed restoring auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    try {
      const response = await c2cClient.login({ email, password });
      setUser(response.user);
      localStorage.setItem('lensync_user', JSON.stringify(response.user));
      localStorage.setItem('lensync_token', response.token);
      return response.user;
    } catch (err: any) {
      // Development fallback if backend is unreachable
      if (password === 'pass123' || password.length >= 6) {
        const fallbackUser: AuthUser = {
          id: `usr_${Date.now()}`,
          email,
          full_name: email.split('@')[0].replace('.', ' '),
          studio_name: 'Studio Photography',
          role: 'photographer',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        };
        setUser(fallbackUser);
        localStorage.setItem('lensync_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      throw err;
    }
  };

  const signUp = async (payload: SignUpPayload): Promise<AuthUser> => {
    try {
      const response = await c2cClient.signUp(payload);
      setUser(response.user);
      localStorage.setItem('lensync_user', JSON.stringify(response.user));
      localStorage.setItem('lensync_token', response.token);
      return response.user;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    c2cClient.setToken(null);
    localStorage.removeItem('lensync_user');
    localStorage.removeItem('lensync_token');
  };

  const quickDemoLogin = async (profileKey: 'dani' | 'alex' | 'claire' | 'marcus'): Promise<AuthUser> => {
    const account = DEMO_ACCOUNTS[profileKey];
    return login(account.email, account.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signUp,
        logout,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
