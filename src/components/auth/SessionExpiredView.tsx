import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';

export const SessionExpiredView: React.FC = () => {
  const { navigateTo } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-xs">
          <Clock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900">Session Expired</h3>
        <p className="mt-2 text-sm text-slate-600">
          Your development session has ended or credentials have reset. Please sign back in to
          continue your session.
        </p>

        <div className="mt-6">
          <Button variant="primary" onClick={() => navigateTo('/login')} className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In Again
          </Button>
        </div>
      </div>
    </div>
  );
};
