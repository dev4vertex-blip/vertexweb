import React from 'react';
import { UserListItem, AuthUser } from '../../../types/auth';
import { Eye, Edit3, Power, Trash2, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

interface UserTableProps {
  users: UserListItem[];
  currentUser: AuthUser | null;
  isLoading: boolean;
  onViewDetails: (user: UserListItem) => void;
  onEditUser: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  onDeleteUser: (user: UserListItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUser,
  isLoading,
  onViewDetails,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SALES':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FINANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'TECHNICIAN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'CUSTOMER':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Inactive
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Check if current logged in user can edit a specific target user
  const canEdit = (targetUser: UserListItem) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'MANAGER') {
      return targetUser.role === 'SALES';
    }
    return false;
  };

  // Check if current user can deactivate target user
  const canToggle = (targetUser: UserListItem) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'MANAGER') {
      return targetUser.role === 'SALES';
    }
    return false;
  };

  // Check if current user can delete target user
  const canDelete = (targetUser: UserListItem) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' && targetUser.role !== 'SUPER_ADMIN') return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No users found</h3>
        <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria, role filters, or location scopes.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">User ID</th>
              <th className="py-3.5 px-4">Name & Contact</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">City / Hub</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4">Last Login</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
            {users.map((user) => {
              const initials = user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-600 whitespace-nowrap">
                    {user.publicId}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                          {user.email && <span>{user.email}</span>}
                          {user.phone && <span>• {user.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.roleName || user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {user.cityName || 'All India'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewDetails(user)}
                        title="View Details"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canEdit(user) && (
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          title="Edit User"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {canToggle(user) && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(user)}
                          title={user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete(user) && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user)}
                          title="Delete User"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
