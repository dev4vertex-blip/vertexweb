import { AuthUser, LoginCredentials, OtpCredentials, UserListItem, CityItem, RoleItem } from '../types/auth';
import { secureStorage } from './storage';

/**
 * Resolves the API base URL based on mobile or web environment.
 * Uses VITE_API_BASE_URL if configured; otherwise falls back to current origin or relative path.
 * In production: strictly enforces HTTPS and rejects localhost / 127.0.0.1.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    const isProduction = import.meta.env?.PROD || process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
        console.error('[VERTEX Security] Localhost or loopback API URL is forbidden in production release builds.');
        return '';
      }
      if (trimmed.startsWith('http://')) {
        console.error('[VERTEX Security] Insecure HTTP API URL is forbidden in production release builds. HTTPS is required.');
      }
    }
    return trimmed;
  }
  return '';
}

class ApiService {
  private getToken(): string | null {
    return secureStorage.getToken();
  }

  public setToken(token: string) {
    secureStorage.setToken(token);
  }

  public removeToken() {
    secureStorage.removeToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    const fullUrl =
      endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? endpoint
        : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
      });
    } catch {
      // Mobile network or offline connection failure
      const netError = new Error('Unable to connect to VERTEX servers. Please check your internet connection and try again.') as any;
      netError.code = 'NETWORK_ERROR';
      netError.status = 0;
      throw netError;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.code = data?.error?.code || 'API_ERROR';
      err.status = response.status;
      throw err;
    }

    return data;
  }

  // --- Auth Endpoints ---
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const res = await this.request<{ success: boolean; user: AuthUser; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return { user: res.user, token: res.token };
  }

  async loginOtp(credentials: OtpCredentials): Promise<{ user: AuthUser; token: string }> {
    const res = await this.request<{ success: boolean; user: AuthUser; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return { user: res.user, token: res.token };
  }

  async getMe(): Promise<AuthUser> {
    const res = await this.request<{ success: boolean; user: AuthUser }>('/api/v1/auth/me');
    return res.user;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  // --- Users Endpoints ---
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    cityId?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{
    data: UserListItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.cityId) query.set('cityId', String(params.cityId));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const res = await this.request<{
      success: boolean;
      data: UserListItem[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/v1/users?${query.toString()}`);

    return { data: res.data, meta: res.meta };
  }

  async getUserById(id: string): Promise<{ user: AuthUser; auditHistory: any[] }> {
    const res = await this.request<{ success: boolean; user: AuthUser; auditHistory: any[] }>(`/api/v1/users/${id}`);
    return { user: res.user, auditHistory: res.auditHistory };
  }

  async createUser(userData: any): Promise<{ user: AuthUser; message: string }> {
    const res = await this.request<{ success: boolean; user: AuthUser; message: string }>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return { user: res.user, message: res.message };
  }

  async updateUser(id: string, userData: any): Promise<{ user: AuthUser; message: string }> {
    const res = await this.request<{ success: boolean; user: AuthUser; message: string }>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return { user: res.user, message: res.message };
  }

  async updateUserStatus(id: string, status: string, reason?: string): Promise<{ status: string; message: string }> {
    const res = await this.request<{ success: boolean; status: string; message: string }>(`/api/v1/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return { status: res.status, message: res.message };
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await this.request<{ success: boolean; message: string }>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
    return { message: res.message };
  }

  // --- Metadata Endpoints ---
  async getCities(): Promise<CityItem[]> {
    const res = await this.request<{ success: boolean; data: CityItem[] }>('/api/v1/cities');
    return res.data;
  }

  async getRoles(): Promise<RoleItem[]> {
    const res = await this.request<{ success: boolean; data: RoleItem[] }>('/api/v1/roles');
    return res.data;
  }

  async getPermissions(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/permissions');
    return res.data;
  }

  async getAuditLogs(params: { limit?: number; action?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.action) query.set('action', params.action);
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/audit-logs?${query.toString()}`);
    return res.data;
  }

  // --- Technician Endpoints ---
  async getTechnicianProfile(): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>('/api/v1/technician/profile');
    return res.data;
  }

  async getTechnicianJobs(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/technician/jobs');
    return res.data;
  }

  async getTechnicianJobById(id: string): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>(`/api/v1/technician/jobs/${id}`);
    return res.data;
  }

  async acceptTechnicianJob(id: string): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/accept`, { method: 'POST' });
  }

  async rejectTechnicianJob(id: string): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/reject`, { method: 'POST' });
  }

  async enRouteTechnicianJob(id: string): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/en-route`, { method: 'POST' });
  }

  async arrivedTechnicianJob(id: string): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/arrived`, { method: 'POST' });
  }

  async startTechnicianJob(id: string, otp: string): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/start`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  async completeTechnicianJob(
    id: string,
    report: { workPerformed?: string; partsUsed?: string; technicianNotes?: string; customerRemarks?: string }
  ): Promise<any> {
    return this.request(`/api/v1/technician/jobs/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async toggleTechnicianDuty(isOnDuty: boolean): Promise<any> {
    return this.request('/api/v1/technician/duty-toggle', {
      method: 'POST',
      body: JSON.stringify({ isOnDuty }),
    });
  }

  async getTechnicianEarnings(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/technician/earnings');
    return res.data;
  }

  async getTechnicianAttendance(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/technician/attendance');
    return res.data;
  }

  async punchTechnicianAttendance(isCheckedIn: boolean): Promise<any> {
    return this.request('/api/v1/technician/attendance/punch', {
      method: 'POST',
      body: JSON.stringify({ isCheckedIn }),
    });
  }

  async getTechnicianNotifications(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/technician/notifications');
    return res.data;
  }
}

export const api = new ApiService();
