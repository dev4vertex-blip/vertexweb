import React, { useState, useEffect } from 'react';
import { UserListItem, AuthUser } from '../../../types/auth';
import { api } from '../../../services/api';
import { X, ShieldCheck, Mail, Phone, MapPin, Calendar, Clock, Award, Activity, History } from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userItem: UserListItem | null;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userItem,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const [fullUser, setFullUser] = useState<AuthUser | null>(null);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userItem) {
      setIsLoading(true);
      setActiveTab('overview');
      api
        .getUserById(userItem.id)
        .then((res) => {
          setFullUser(res.user);
          setAuditHistory(res.auditHistory || []);
        })
        .catch((err) => {
          console.error('Failed to load user details:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, userItem]);

  if (!isOpen || !userItem) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center border border-indigo-200 shrink-0">
              {userItem.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{userItem.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {userItem.roleName || userItem.role}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-3">
                <span>{userItem.publicId}</span>
                <span>• Status: {userItem.status}</span>
                <span>• Hub: {userItem.cityName || 'All India'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Profile & Scopes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Audit History ({auditHistory.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading user dossier...</div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Contact & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-500">Email Address</div>
                      <div className="font-medium text-slate-800">{fullUser?.email || 'Not configured'}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-500">Phone Number</div>
                      <div className="font-medium text-slate-800">{fullUser?.phone || 'Not configured'}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-500">Assigned Hub / City</div>
                      <div className="font-medium text-slate-800">{fullUser?.cityName || 'All India'}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-500">Account Created</div>
                      <div className="font-medium text-slate-800">
                        {fullUser?.createdAt ? new Date(fullUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-Specific Metrics */}
              {fullUser?.role === 'SALES' && fullUser.profile && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Sales Commercial Profile
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 text-xs">
                      <div className="text-slate-500">Monthly Target</div>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">
                        ₹{Number(fullUser.profile.monthly_target || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200 text-xs">
                      <div className="text-slate-500">Commission Rate</div>
                      <div className="text-base font-bold text-indigo-700 mt-0.5">
                        {fullUser.profile.commission_rate}%
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="text-slate-500">Base Compensation</div>
                      <div className="text-base font-bold text-slate-800 mt-0.5">
                        ₹{Number(fullUser.profile.base_salary || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {fullUser?.role === 'TECHNICIAN' && fullUser.profile && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Field Technician Capabilities
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Verified Rating:</span>
                      <span className="font-bold text-amber-600">★ {fullUser.profile.rating || '5.0'} / 5.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Experience:</span>
                      <span className="font-semibold text-slate-800">{fullUser.profile.experience_years} Years</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Assigned Skills:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          try {
                            const skills = typeof fullUser.profile.skills === 'string' ? JSON.parse(fullUser.profile.skills) : fullUser.profile.skills;
                            return (skills || []).map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700">
                                {s}
                              </span>
                            ));
                          } catch {
                            return <span className="text-slate-600">General Maintenance</span>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Permissions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Effective Permissions ({fullUser?.permissions?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {(fullUser?.permissions || []).map((perm: string) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Audit Tab */
            <div className="space-y-3">
              {auditHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No audit records logged yet.</div>
              ) : (
                auditHistory.map((log: any) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 font-mono">{log.action}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-600 flex items-center gap-2">
                      <span>Triggered by: <strong>{log.user_name}</strong> ({log.user_role})</span>
                      <span>• IP: {log.ip_address}</span>
                    </div>
                    {log.new_value && (
                      <div className="mt-1.5 p-1.5 bg-white rounded border border-slate-200 font-mono text-[10px] text-slate-500 overflow-x-auto">
                        {log.new_value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
