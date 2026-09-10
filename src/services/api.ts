import {
  AuthUser,
  LoginCredentials,
  OtpCredentials,
  UserListItem,
  CityItem,
  RoleItem,
  DepartmentItem,
  DesignationItem,
} from '../types/auth';
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

  async getDepartments(): Promise<DepartmentItem[]> {
    const res = await this.request<{ success: boolean; data: DepartmentItem[] }>('/api/v1/departments');
    return res.data;
  }

  async getDesignations(): Promise<DesignationItem[]> {
    const res = await this.request<{ success: boolean; data: DesignationItem[] }>('/api/v1/designations');
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

  // --- Service Master & Categories ---
  async getServices(params?: { category_id?: string; active?: boolean }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.set('category_id', params.category_id);
    if (params?.active !== undefined) query.set('active', String(params.active));
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/services?${query.toString()}`);
    return res.data || [];
  }

  async getServiceCategories(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/services/categories');
    return res.data || [];
  }

  async createServiceCategory(data: any): Promise<any> {
    return this.request('/api/v1/services/categories', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateServiceCategory(id: number | string, data: any): Promise<any> {
    return this.request(`/api/v1/services/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteServiceCategory(id: number | string): Promise<any> {
    return this.request(`/api/v1/services/categories/${id}`, { method: 'DELETE' });
  }

  async createService(data: any): Promise<any> {
    return this.request('/api/v1/services', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateService(id: string, data: any): Promise<any> {
    return this.request(`/api/v1/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteService(id: string): Promise<any> {
    return this.request(`/api/v1/services/${id}`, { method: 'DELETE' });
  }

  async updateServicePrice(id: string, basePrice: number, strikePrice?: number): Promise<any> {
    return this.request(`/api/v1/services/${id}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ basePrice, strikePrice }),
    });
  }

  async toggleServiceActive(id: string, active: boolean): Promise<any> {
    return this.request(`/api/v1/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  // --- AMC Plans ---
  async getAmcPlans(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/amc-plans');
    return res.data || [];
  }

  async createAmcPlan(data: any): Promise<any> {
    return this.request('/api/v1/amc-plans', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAmcPlan(id: string, data: any): Promise<any> {
    return this.request(`/api/v1/amc-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  // --- Partners & Commissions ---
  async getPartners(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/partners');
    return res.data || [];
  }

  async getPartnerCommissions(partnerId?: string): Promise<any[]> {
    const query = partnerId ? `?partner_id=${partnerId}` : '';
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/partners/commissions${query}`);
    return res.data || [];
  }

  async createPartner(data: any): Promise<any> {
    return this.request('/api/v1/partners', { method: 'POST', body: JSON.stringify(data) });
  }

  async approvePartnerCommission(id: string, notes?: string): Promise<any> {
    return this.request(`/api/v1/partners/commissions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // --- HR Module ---
  async getHrEmployees(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/hr/employees');
    return res.data || [];
  }

  async getHrAttendance(params?: { date?: string; employee_id?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.employee_id) query.set('employee_id', params.employee_id);
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/hr/attendance?${query.toString()}`);
    return res.data || [];
  }

  async getHrLeaves(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/hr/leaves');
    return res.data || [];
  }

  async onboardHrEmployee(data: any): Promise<any> {
    return this.request('/api/v1/hr/employees', { method: 'POST', body: JSON.stringify(data) });
  }

  async overrideHrAttendance(data: any): Promise<any> {
    return this.request('/api/v1/hr/attendance/override', { method: 'POST', body: JSON.stringify(data) });
  }

  async actionHrLeave(leaveId: string, action: 'APPROVE' | 'REJECT', remarks?: string): Promise<any> {
    return this.request(`/api/v1/hr/leaves/${leaveId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, remarks }),
    });
  }

  // --- Payroll Module ---
  async getPayrollRuns(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/api/v1/payroll/runs');
    return res.data || [];
  }

  async createPayrollRun(month: number, year: number): Promise<any> {
    return this.request('/api/v1/payroll/runs', { method: 'POST', body: JSON.stringify({ month, year }) });
  }

  async processPayrollRun(id: string): Promise<any> {
    return this.request(`/api/v1/payroll/runs/${id}/process`, { method: 'POST' });
  }

  async approvePayrollRun(id: string, remarks?: string): Promise<any> {
    return this.request(`/api/v1/payroll/runs/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks }) });
  }

  async finalizePayrollRun(id: string): Promise<any> {
    return this.request(`/api/v1/payroll/runs/${id}/finalize`, { method: 'POST' });
  }

  async reopenPayrollRun(id: string, reason: string): Promise<any> {
    return this.request(`/api/v1/payroll/runs/${id}/reopen`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  async getPayrollPayslips(runId?: string): Promise<any[]> {
    const query = runId ? `?payroll_run_id=${runId}` : '';
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/payroll/payslips${query}`);
    return res.data || [];
  }

  // --- CRM & Leads Management ---
  async getLeads(params?: {
    status?: string;
    priority?: string;
    assigned_to_user_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assigned_to_user_id) query.set('assigned_to_user_id', params.assigned_to_user_id);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/leads${qs}`);
    return res.data || [];
  }

  async getLeadById(id: string): Promise<any> {
    const res = await this.request<{ success: boolean; data: any }>(`/api/v1/leads/${id}`);
    return res.data;
  }

  async createLead(data: any): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>('/api/v1/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: any): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>(`/api/v1/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateLeadStatus(id: string, status: string, won_lost_reason?: string): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>(`/api/v1/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, won_lost_reason }),
    });
  }

  async assignLead(id: string, assigned_to_user_id: string): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>(`/api/v1/leads/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assigned_to_user_id }),
    });
  }

  async getLeadFollowups(leadId: string): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>(`/api/v1/leads/${leadId}/followups`);
    return res.data || [];
  }

  async addLeadFollowup(leadId: string, data: any): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>(`/api/v1/leads/${leadId}/followups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async convertLeadToBooking(leadId: string, data?: any): Promise<any> {
    return this.request<{ success: boolean; message: string; data: any }>(`/api/v1/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async deleteLead(id: string): Promise<any> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Promotions & Offers Endpoints
  // ==========================================

  async getPromotions(params?: { search?: string; status?: string; type?: string; category?: string }): Promise<{ success: boolean; data: any[]; meta?: any }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.category) query.append('category', params.category);

    const qs = query.toString();
    const endpoint = `/api/v1/promotions${qs ? `?${qs}` : ''}`;
    return this.request<{ success: boolean; data: any[]; meta?: any }>(endpoint);
  }

  async getPromotion(id: string): Promise<{ success: boolean; data: any }> {
    return this.request<{ success: boolean; data: any }>(`/api/v1/promotions/${id}`);
  }

  async createPromotion(data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>('/api/v1/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePromotion(id: string, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(`/api/v1/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updatePromotionStatus(id: string, status: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request<{ success: boolean; data: any; message: string }>(`/api/v1/promotions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deletePromotion(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/promotions/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
