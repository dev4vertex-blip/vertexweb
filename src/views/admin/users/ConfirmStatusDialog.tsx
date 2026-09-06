import React, { useState } from 'react';
import { UserListItem } from '../../../types/auth';
import { api } from '../../../services/api';
import { X, AlertTriangle, CheckCircle2, Power } from 'lucide-react';

interface ConfirmStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  onStatusChanged: () => void;
}

export const ConfirmStatusDialog: React.FC<ConfirmStatusDialogProps> = ({
  isOpen,
  onClose,
  user,
  onStatusChanged,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const targetStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const isDeactivating = targetStatus === 'INACTIVE';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.updateUserStatus(user.id, targetStatus, reason.trim() || undefined);
      onStatusChanged();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isDeactivating ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isDeactivating ? <AlertTriangle className="w-5 h-5" /> : <Power className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isDeactivating ? 'Deactivate User Account' : 'Activate User Account'}
              </h3>
              <p className="text-xs text-slate-500">
                {user.name} ({user.publicId})
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            {isDeactivating
              ? `Are you sure you want to deactivate ${user.name}? They will immediately be prohibited from signing into the VERTEX portal and mobile applications.`
              : `Are you sure you want to restore access for ${user.name}? They will be able to log in and resume their assigned role capabilities.`}
          </p>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Administrative Notes (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isDeactivating ? 'e.g. On leave, resignation, or policy audit' : 'e.g. Reinstated after review'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {errorMsg && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isDeactivating
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'Updating...' : isDeactivating ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
