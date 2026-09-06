import { AuthUser, LoginCredentials, OtpCredentials, UserListItem, CityItem, RoleItem } from '../types/auth';

const TOKEN_KEY = 'vertex_auth_token';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public removeToken() {
    localStorage.removeItem(TOKEN_KEY);
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

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

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
}

export const api = new ApiService();
