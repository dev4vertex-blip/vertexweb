import { AuditActionType, AuditLogEntry, UserRole } from '../types/auth';

const STORAGE_KEY = 'vertex_audit_logs';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-1001',
    timestamp: '2026-09-06 09:15:22',
    userId: 'usr-admin-1',
    userName: 'Vikramaditya Sengupta',
    userRole: 'SUPER_ADMIN',
    action: 'LOGIN',
    details: 'Successful Super Admin console authentication from primary IP',
    ipAddress: '103.21.14.92',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-1002',
    timestamp: '2026-09-06 09:32:10',
    userId: 'usr-mgr-1',
    userName: 'Pooja Kashyap',
    userRole: 'MANAGER',
    action: 'ROLE_CHANGED',
    details: 'Assigned Sales Territory Gurgaon DLF Phase 1-5 to Karan Mehra',
    ipAddress: '103.21.14.88',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-1003',
    timestamp: '2026-09-06 10:04:45',
    userId: 'usr-fin-1',
    userName: 'Suresh Narang',
    userRole: 'FINANCE',
    action: 'LOGIN',
    details: 'Finance officer logged in; reviewed weekly partner commission batch',
    ipAddress: '49.36.18.201',
    status: 'SUCCESS',
  },
  {
    id: 'AUD-1004',
    timestamp: '2026-09-06 10:45:00',
    userId: 'usr-sales-1',
    userName: 'Karan Mehra',
    userRole: 'SALES',
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    details: 'Blocked attempt to navigate directly to /admin/integrations (insufficient permission)',
    ipAddress: '14.143.12.8',
    status: 'WARNING',
  },
];

class AuditService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      } else {
        this.logs = [...INITIAL_AUDIT_LOGS];
        this.persist();
      }
    } catch {
      this.logs = [...INITIAL_AUDIT_LOGS];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Storage quota or sandboxing fallback
    }
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public record(
    action: AuditActionType,
    userId: string,
    userName: string,
    userRole: UserRole,
    details: string,
    status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS',
    ipAddress: string = '127.0.0.1'
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId,
      userName,
      userRole,
      action,
      details,
      ipAddress,
      status,
    };

    this.logs.unshift(entry);
    // Keep max 100 in memory/storage
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
    this.persist();
    return entry;
  }
}

export const auditService = new AuditService();
