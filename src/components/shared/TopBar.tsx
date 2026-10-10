import React, { useState } from 'react';
import { useSurplusLink } from '../../context/SurplusLinkContext';
import { Store, HeartHandshake, Bell, X, CheckCircle2, AlertTriangle, Info, RotateCcw, UtensilsCrossed } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeRole,
    setActiveRole,
    resetAllData,
    notifications,
    dismissNotification,
  } = useSurplusLink();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Filter notifications relevant to current role
  const roleNotifications = notifications.filter((n) => {
    if (n.targetRole === 'all') return true;
    if (activeRole === 'ngo') return n.targetRole === 'ngo';
    return n.targetRole === 'provider';
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shadow-emerald-600/30">
              <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  SurplusLink
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 leading-none">
                Food Redistribution
              </p>
            </div>
          </div>

          {/* Central Role Switcher (Provider / NGO) */}
          <div className="flex items-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveRole('provider')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap min-h-[38px] sm:min-h-[40px] cursor-pointer ${
                  activeRole === 'provider'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Provider</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRole('ngo')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap min-h-[38px] sm:min-h-[40px] cursor-pointer ${
                  activeRole === 'ngo'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <HeartHandshake className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>NGO</span>
              </button>
            </div>
          </div>

          {/* Right Action Controls: Notification Bell & Reset */}
          <div className="flex items-center gap-2">
            {/* Notification Bell with count */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {roleNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950 shadow-xs">
                    {roleNotifications.length > 9 ? '9+' : roleNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-900">
                        {activeRole === 'ngo' ? 'NGO Alerts' : 'Provider Alerts'} ({roleNotifications.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors duration-150 cursor-pointer"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {roleNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications for this role.
                      </div>
                    ) : (
                      roleNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 text-xs hover:bg-slate-50 transition-colors duration-150 flex items-start justify-between gap-2"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {notif.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                              {notif.type === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              {notif.type === 'error' && <X className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                              {notif.type === 'info' && <Info className="h-3.5 w-3.5 text-sky-600 shrink-0" />}
                              <span className="truncate">{notif.title}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                            <span className="text-xs text-slate-400 block">{notif.timestamp}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => dismissNotification(notif.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                            title="Dismiss"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              onClick={resetAllData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors duration-150 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Reset state to initial demo data"
              aria-label="Reset demo data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
