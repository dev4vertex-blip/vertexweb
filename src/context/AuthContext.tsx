import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  LoginCredentials,
  OtpCredentials,
  UserRole,
  PermissionKey,
  ActionKey,
} from '../types/auth';
import { authService } from '../auth/authService';
import { api } from '../services/api';
import {
  hasRole as checkRole,
  hasPermission as checkPermission,
  canAccessRoute as checkRoute,
  canPerformAction as checkAction,
} from '../auth/permissions';
import { auditService } from '../auth/audit';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  currentPath: string;
  navigateTo: (path: string) => void;
  loginWithCredentials: (credentials: LoginCredentials) => Promise<AuthUser>;
  loginWithOtp: (credentials: OtpCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  // Reusable permission helpers
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessRoute: (path: string) => boolean;
  canPerformAction: (action: ActionKey) => boolean;
  getDefaultDashboardForRole: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getDefaultDashboardForRole = (role: UserRole): string => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer';
    case 'TECHNICIAN':
    case 'PARTNER':
      return '/technician';
    case 'SALES':
    case 'SALES_TEAM':
    case 'MANAGER':
    case 'FINANCE':
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'MARKETING':
    case 'OPERATIONS':
    case 'SUPPORT':
    case 'HR':
    case 'PAYROLL':
    case 'EMPLOYEE':
    default:
      return '/admin';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  
  // URL path management synchronized with window.location.pathname / hash
  const getInitialPath = (): string => {
    if (typeof window === 'undefined') return '/login';
    const path = window.location.pathname;
    // Normalize or fallback
    if (path === '/' || path === '') return '/login';
    return path;
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);

  // Navigate helper with history push
  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/login';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize authentication on app load, verifying existing sessions and handling errors safely
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const stored = authService.getStoredSession();
        if (!stored || !stored.user) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        // Ensure token is attached to the API client for subsequent calls
        if (stored.token) {
          api.setToken(stored.token);
        }

        // Reject any legacy demo tokens immediately
        if (stored.token && stored.token.startsWith('vtx_local_')) {
          authService.clearSession();
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        // Optimistically populate cached user to eliminate visual flicker
        if (isMounted) {
          setUser(stored.user);
        }

        // Verify session validity with backend API
        try {
          const verifiedUser = await authService.syncCurrentUser();
          if (!isMounted) return;

          if (verifiedUser) {
            setUser(verifiedUser);
          }

          // If on /login, root path, or empty, navigate to the default dashboard for role
          const initialPath = window.location.pathname;
          if (initialPath === '/login' || initialPath === '/' || initialPath === '') {
            const dest = getDefaultDashboardForRole(stored.user.role);
            navigateTo(dest);
          }
        } catch (authError: any) {
          console.warn('Authentication verification promise failed:', authError);

          const isUnauthorized =
            authError?.status === 401 ||
            authError?.status === 403 ||
            authError?.code === 'UNAUTHORIZED' ||
            authError?.code === 'INVALID_TOKEN' ||
            authError?.code === 'USER_NOT_FOUND' ||
            authError?.code === 'ACCOUNT_DISABLED';

          if (isUnauthorized) {
            authService.clearSession();
            if (isMounted) {
              setUser(null);
              setSessionExpired(true);
            }
          } else {
            // Non-auth failure (e.g. temporary network error): retain cached session credentials
            console.info('Retaining cached session credentials during temporary network issue.');
            if (isMounted) {
              setUser(stored.user);
            }
          }
        }
      } catch (err) {
        console.error('Authentication initialization failed:', err);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [navigateTo]);

  const loginWithCredentials = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setSessionExpired(false);
    try {
      const authUser = await authService.loginWithCredentials(credentials);
      setUser(authUser);
      const destination = getDefaultDashboardForRole(authUser.role);
      navigateTo(destination);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (credentials: OtpCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setSessionExpired(false);
    try {
      const authUser = await authService.loginWithOtp(credentials);
      setUser(authUser);
      const destination = getDefaultDashboardForRole(authUser.role);
      navigateTo(destination);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const prevUser = user;
    setUser(null);
    await authService.logout(prevUser);
    navigateTo('/login');
    // Replace state so browser back button does not reopen previous protected screen
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/login');
    }
  };

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      return checkRole(user, role);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      return checkPermission(user, permission);
    },
    [user]
  );

  const canAccessRoute = useCallback(
    (path: string): boolean => {
      const allowed = checkRoute(user, path);
      if (!allowed && user) {
        // Record blocked route attempt in audit log
        auditService.record(
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          user.id,
          user.name,
          user.role,
          `Blocked attempt to access protected route: ${path}`,
          'WARNING'
        );
      }
      return allowed;
    },
    [user]
  );

  const canPerformAction = useCallback(
    (action: ActionKey): boolean => {
      return checkAction(user, action);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionExpired,
        currentPath,
        navigateTo,
        loginWithCredentials,
        loginWithOtp,
        logout,
        hasRole,
        hasPermission,
        canAccessRoute,
        canPerformAction,
        getDefaultDashboardForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
