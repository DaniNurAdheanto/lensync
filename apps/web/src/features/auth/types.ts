export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'photographer' | 'assistant' | 'client' | 'editor';
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
