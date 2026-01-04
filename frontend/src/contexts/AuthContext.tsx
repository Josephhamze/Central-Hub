import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api, setAuthToken, clearAuthToken } from '@services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  themePreference: 'LIGHT' | 'DARK' | 'SYSTEM';
  roles: string[];
  permissions: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    inviteCode: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_tokens';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data.data);
    } catch {
      clearAuthToken();
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const initAuth = useCallback(async () => {
    const storedTokens = localStorage.getItem(TOKEN_KEY);
    if (storedTokens) {
      try {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        setAuthToken(tokens.accessToken);
        await fetchUser();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    setIsLoading(false);
  }, [fetchUser]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const tokens: AuthTokens = response.data.data;

    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    setAuthToken(tokens.accessToken);
    await fetchUser();
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    inviteCode: string
  ) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      inviteCode,
    });
    const tokens: AuthTokens = response.data.data;

    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    setAuthToken(tokens.accessToken);
    await fetchUser();
  };

  const logout = async () => {
    try {
      const storedTokens = localStorage.getItem(TOKEN_KEY);
      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearAuthToken();
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
      }}
    >
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


