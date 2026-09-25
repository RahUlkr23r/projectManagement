import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAccessToken, apiRequest } from '../services/api';
import { ActivityLog, AppNotification } from '../types';

interface WebSocketContextType {
  onlineUsersCount: number;
  activities: ActivityLog[];
  notifications: AppNotification[];
  unreadCount: number;
  fetchMissedActivities: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  taskUpdateSignal: number;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(1);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [taskUpdateSignal, setTaskUpdateSignal] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);

  // Fetch initial notifications & unread count
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [notifs, unread] = await Promise.all([
        apiRequest<AppNotification[]>('/api/notifications'),
        apiRequest<{ count: number }>('/api/notifications/unread-count'),
      ]);
      setNotifications(notifs);
      setUnreadCount(unread.count);
    } catch {
      // Ignore
    }
  }, [user]);

  // Fetch missed activities from PostgreSQL (not in-memory cache)
  const fetchMissedActivities = useCallback(async () => {
    if (!user) return;
    try {
      const recent = await apiRequest<ActivityLog[]>('/api/activity?limit=20');
      setActivities(recent);
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial load from DB
    fetchMissedActivities();
    loadNotifications();

    const token = getAccessToken();
    if (!token) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        switch (payload.type) {
          case 'CONNECTED':
            if (payload.data?.onlineUsersCount !== undefined) {
              setOnlineUsersCount(payload.data.onlineUsersCount);
            }
            break;

          case 'PRESENCE_UPDATE':
            if (payload.data?.onlineUsersCount !== undefined) {
              setOnlineUsersCount(payload.data.onlineUsersCount);
            }
            break;

          case 'ACTIVITY_FEED_UPDATE': {
            const newAct = payload.data;
            setActivities((prev) => [
              {
                id: newAct.activityId,
                taskId: newAct.taskId,
                projectId: newAct.projectId,
                userId: newAct.userId,
                previousStatus: newAct.previousStatus,
                newStatus: newAct.newStatus,
                message: newAct.message,
                createdAt: newAct.createdAt,
                user: { id: newAct.userId, name: newAct.userName, role: 'DEVELOPER' },
                task: { id: newAct.taskId, title: newAct.taskTitle, taskNumber: newAct.taskNumber },
                project: { id: newAct.projectId, name: newAct.projectName },
              },
              ...prev.slice(0, 49),
            ]);
            setTaskUpdateSignal((prev) => prev + 1);
            break;
          }

          case 'NOTIFICATION_RECEIVED': {
            const notif = payload.data;
            setNotifications((prev) => [
              {
                id: notif.id,
                userId: notif.userId,
                type: notif.type,
                title: notif.title,
                message: notif.message,
                isRead: notif.isRead,
                createdAt: notif.createdAt,
              },
              ...prev,
            ]);
            setUnreadCount(notif.unreadCount);
            break;
          }

          case 'TASK_UPDATED':
            setTaskUpdateSignal((prev) => prev + 1);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message', err);
      }
    };

    ws.onclose = () => {
      // Automatic reconnect could be added or handled on user interaction
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [user, fetchMissedActivities, loadNotifications]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        onlineUsersCount,
        activities,
        notifications,
        unreadCount,
        fetchMissedActivities,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        taskUpdateSignal,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
