import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Bell, Users, LogOut, CheckCheck, CircleDot } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { onlineUsersCount, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } =
    useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            V
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Velozity</span>
            <span className="text-xs text-slate-400 block -mt-1">Project Dashboard</span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-5">
          {/* Presence Indicator (Spec 5: Admin live count of online users via WS) */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">
              <strong className="text-white">{onlineUsersCount}</strong> online
            </span>
          </div>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markNotificationAsRead(n.id)}
                        className={`p-3 text-xs transition cursor-pointer flex items-start space-x-2.5 ${
                          n.isRead ? 'bg-slate-900/40 opacity-70 hover:opacity-100' : 'bg-slate-800/40 hover:bg-slate-800/70'
                        }`}
                      >
                        <CircleDot
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            n.isRead ? 'text-slate-600' : 'text-blue-400'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile & Role Badge */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="text-right">
              <span className="text-sm font-semibold text-white block leading-tight">
                {user.name}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                    : user.role === 'PROJECT_MANAGER'
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                    : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                }`}
              >
                {user.role.replace('_', ' ')}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
