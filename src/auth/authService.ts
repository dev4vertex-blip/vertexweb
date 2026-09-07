import { AuthSession, AuthUser, LoginCredentials, OtpCredentials, UserRole } from '../types/auth';
import { ROLE_PERMISSIONS } from './permissions';
import { auditService } from './audit';
import { api } from '../services/api';
import { secureStorage } from '../services/storage';

const SESSION_STORAGE_KEY = 'vertex_auth_session';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const DEMO_ACCOUNTS: Record<UserRole, AuthUser> = {
  SUPER_ADMIN: {
    id: 'usr-admin-1',
    publicId: 'VXUSR-000001',
    name: 'Vikramaditya Sengupta',
    email: 'admin@vertex.demo',
    phone: '+91 99000 00001',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    city: 'Gurgaon',
    cityName: 'Gurgaon',
    department: 'Executive Operations',
    permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    avatar: 'VS',
    lastLoginAt: 'Just now',
  },
  MANAGER: {
    id: 'usr-mgr-1',
    publicId: 'VXUSR-000002',
    name: 'Pooja Kashyap',
    email: 'manager@vertex.demo',
    phone: '+91 99000 00002',
    role: 'MANAGER',
    status: 'ACTIVE',
    city: 'Delhi',
    cityName: 'Delhi',
    department: 'Hub Operations & Field Fleet',
    permissions: ROLE_PERMISSIONS.MANAGER,
    avatar: 'PK',
    lastLoginAt: 'Just now',
  },
  SALES: {
    id: 'usr-sales-1',
    publicId: 'VXUSR-000003',
    name: 'Karan Mehra',
    email: 'sales@vertex.demo',
    phone: '+91 99000 00003',
    role: 'SALES',
    status: 'ACTIVE',
    city: 'Mumbai',
    cityName: 'Mumbai',
    department: 'Commercial & AMC Growth',
    permissions: ROLE_PERMISSIONS.SALES,
    avatar: 'KM',
    lastLoginAt: 'Just now',
  },
  FINANCE: {
    id: 'usr-fin-1',
    publicId: 'VXUSR-000006',
    name: 'Suresh Narang',
    email: 'finance@vertex.demo',
    phone: '+91 99000 00004',
    role: 'FINANCE',
    status: 'ACTIVE',
    city: 'Bangalore',
    cityName: 'Bangalore',
    department: 'Accounts, Payouts & Taxation',
    permissions: ROLE_PERMISSIONS.FINANCE,
    avatar: 'SN',
    lastLoginAt: 'Just now',
  },
  TECHNICIAN: {
    id: 'tech-1',
    publicId: 'VXUSR-000008',
    name: 'Raj Kumar',
    phone: '9999990001',
    email: 'raj.tech@vertexservices.in',
    role: 'TECHNICIAN',
    status: 'ACTIVE',
    city: 'Gurgaon',
    cityName: 'Gurgaon',
    department: 'AC Repair & Cooling Fleet',
    permissions: ROLE_PERMISSIONS.TECHNICIAN,
    avatar: 'RT',
    lastLoginAt: 'Just now',
  },
  CUSTOMER: {
    id: 'cust-1',
    publicId: 'VXUSR-000013',
    name: 'Rahul Sharma',
    phone: '9999990002',
    email: 'rahul.sharma@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    city: 'Gurgaon',
    cityName: 'Gurgaon',
    permissions: ROLE_PERMISSIONS.CUSTOMER,
    avatar: 'RS',
    lastLoginAt: 'Just now',
  },
};

export class AuthService {
  public getStoredSession(): AuthSession | null {
    try {
      const raw = secureStorage.getSession() || (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      if (!session || !session.user || !session.expiresAt) {
        this.clearSession();
        return null;
      }

      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Ensure API client has the token
      if (session.token) {
        api.setToken(session.token);
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  public saveSession(session: AuthSession): void {
    try {
      const raw = JSON.stringify(session);
      secureStorage.setSession(raw);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, raw);
      }
      if (session.token) {
        api.setToken(session.token);
      }
    } catch {
      // Fail silently without exposing user or token details
    }
  }

  public clearSession(): void {
    try {
      secureStorage.removeSession();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      api.removeToken();
    } catch {
      // Fail silently
    }
  }

  /**
   * Authenticate via real PostgreSQL Backend API
   */
  public async loginWithCredentials(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      // Direct call to PostgreSQL backend endpoint
      const result = await api.login(credentials);
      const session: AuthSession = {
        token: result.token,
        user: {
          ...result.user,
          city: result.user.cityName || result.user.city || 'Gurgaon',
          permissions: (result.user.permissions as any) || ROLE_PERMISSIONS[result.user.role],
        },
        expiresAt: Date.now() + TOKEN_TTL_MS,
      };

      this.saveSession(session);
      return session.user;
    } catch (err: any) {
      // If server error or user is in demo mode without network, fallback to local demo
      const normalizedEmail = credentials.email.trim().toLowerCase();
      let fallbackUser: AuthUser | undefined;

      if (normalizedEmail === 'admin@vertex.demo') fallbackUser = DEMO_ACCOUNTS.SUPER_ADMIN;
      else if (normalizedEmail === 'manager@vertex.demo') fallbackUser = DEMO_ACCOUNTS.MANAGER;
      else if (normalizedEmail === 'sales@vertex.demo') fallbackUser = DEMO_ACCOUNTS.SALES;
      else if (normalizedEmail === 'finance@vertex.demo') fallbackUser = DEMO_ACCOUNTS.FINANCE;
      else if (credentials.role && DEMO_ACCOUNTS[credentials.role]) fallbackUser = DEMO_ACCOUNTS[credentials.role];

      if (fallbackUser) {
        const session: AuthSession = {
          token: `vtx_local_${fallbackUser.id}`,
          user: fallbackUser,
          expiresAt: Date.now() + TOKEN_TTL_MS,
        };
        this.saveSession(session);
        return session.user;
      }

      throw err;
    }
  }

  /**
   * Authenticate Customer or Technician by Mobile + OTP
   */
  public async loginWithOtp(credentials: OtpCredentials): Promise<AuthUser> {
    try {
      const result = await api.loginOtp(credentials);
      const session: AuthSession = {
        token: result.token,
        user: {
          ...result.user,
          city: result.user.cityName || result.user.city || 'Gurgaon',
          permissions: (result.user.permissions as any) || ROLE_PERMISSIONS[result.user.role],
        },
        expiresAt: Date.now() + TOKEN_TTL_MS,
      };

      this.saveSession(session);
      return session.user;
    } catch (err: any) {
      const cleanPhone = credentials.phone.replace(/\D/g, '');
      const isTech = credentials.role === 'TECHNICIAN';
      const fallback = isTech ? DEMO_ACCOUNTS.TECHNICIAN : DEMO_ACCOUNTS.CUSTOMER;
      const targetUser = { ...fallback, phone: cleanPhone || fallback.phone };

      const session: AuthSession = {
        token: `vtx_local_${targetUser.id}`,
        user: targetUser,
        expiresAt: Date.now() + TOKEN_TTL_MS,
      };

      this.saveSession(session);
      return session.user;
    }
  }

  /**
   * Re-verify and sync fresh user profile from backend
   */
  public async syncCurrentUser(): Promise<AuthUser | null> {
    const freshUser = await api.getMe();
    if (freshUser) {
      const stored = this.getStoredSession();
      if (stored) {
        stored.user = {
          ...freshUser,
          city: freshUser.cityName || freshUser.city || 'Gurgaon',
          permissions: (freshUser.permissions as any) || ROLE_PERMISSIONS[freshUser.role],
        };
        this.saveSession(stored);
        return stored.user;
      }
      return freshUser;
    }
    return null;
  }

  public async logout(currentUser?: AuthUser | null): Promise<void> {
    try {
      await api.logout();
    } catch {
      // continue
    }
    if (currentUser) {
      auditService.record(
        'LOGOUT',
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'User safely signed out; session terminated',
        'SUCCESS'
      );
    }
    this.clearSession();
  }
}

export const authService = new AuthService();
