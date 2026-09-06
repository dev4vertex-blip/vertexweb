import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bell, Check, Clock, ShieldCheck, Wrench } from 'lucide-react';

export const CustomerNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead, clearNotifications } = useApp();

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Service updates, technician dispatches, and maintenance alerts
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearNotifications}
            className="text-xs text-slate-500"
          >
            Clear All
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="All caught up"
          description="You don't have any unread notifications or alerts."
          icon={<Bell className="w-6 h-6 text-slate-400" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all ${
                !n.isRead ? 'border-blue-300 bg-blue-50/20' : 'bg-white'
              }`}
              onClick={() => markNotificationAsRead(n.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'booking'
                        ? 'bg-blue-100 text-blue-600'
                        : n.type === 'amc'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {n.type === 'booking' ? (
                      <Wrench className="w-4 h-4" />
                    ) : n.type === 'amc' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {n.timestamp}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(n.id);
                    }}
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
