import { WebSocket } from 'ws';
import { AuthenticatedUser, UserRole } from '../types';

export interface AuthenticatedWebSocket extends WebSocket {
  user?: AuthenticatedUser;
  isAlive?: boolean;
}

export interface ActivityBroadcastPayload {
  activityId: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  assignedToId: string | null;
  userId: string;
  userName: string;
  previousStatus: string | null;
  newStatus: string;
  message: string;
  createdAt: string;
}

export interface NotificationBroadcastPayload {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  unreadCount: number;
}

class WebSocketManager {
  private clients = new Set<AuthenticatedWebSocket>();

  registerClient(ws: AuthenticatedWebSocket): void {
    this.clients.add(ws);
    this.broadcastPresenceToAdmins();
  }

  removeClient(ws: AuthenticatedWebSocket): void {
    this.clients.delete(ws);
    this.broadcastPresenceToAdmins();
  }

  getOnlineUserCount(): number {
    const uniqueUserIds = new Set<string>();
    for (const ws of this.clients) {
      if (ws.user && ws.readyState === WebSocket.OPEN) {
        uniqueUserIds.add(ws.user.id);
      }
    }
    return uniqueUserIds.size;
  }

  /**
   * Broadcasts presence count specifically to Admins whenever user count changes
   */
  broadcastPresenceToAdmins(): void {
    const count = this.getOnlineUserCount();
    const payload = JSON.stringify({
      type: 'PRESENCE_UPDATE',
      data: {
        onlineUsersCount: count,
        timestamp: new Date().toISOString(),
      },
    });

    for (const ws of this.clients) {
      if (
        ws.readyState === WebSocket.OPEN &&
        ws.user?.role === 'ADMIN'
      ) {
        ws.send(payload);
      }
    }
  }

  /**
   * Broadcast activity feed event strictly filtered by user role:
   * - Admin: sees activity across ALL projects
   * - PM: sees activity ONLY from their own projects (projectOwnerId === pm.id)
   * - Developer: sees activity ONLY on tasks assigned to them (assignedToId === dev.id)
   */
  broadcastActivity(activity: ActivityBroadcastPayload): void {
    const payload = JSON.stringify({
      type: 'ACTIVITY_FEED_UPDATE',
      data: activity,
    });

    for (const ws of this.clients) {
      if (ws.readyState !== WebSocket.OPEN || !ws.user) {
        continue;
      }

      const { role, id: currentUserId } = ws.user;

      let isAuthorized = false;

      if (role === 'ADMIN') {
        isAuthorized = true;
      } else if (role === 'PROJECT_MANAGER') {
        isAuthorized = activity.projectOwnerId === currentUserId;
      } else if (role === 'DEVELOPER') {
        isAuthorized = activity.assignedToId === currentUserId;
      }

      if (isAuthorized) {
        ws.send(payload);
      }
    }
  }

  /**
   * Dispatches direct real-time notification to the designated recipient
   */
  sendNotification(recipientId: string, notification: NotificationBroadcastPayload): void {
    const payload = JSON.stringify({
      type: 'NOTIFICATION_RECEIVED',
      data: notification,
    });

    for (const ws of this.clients) {
      if (
        ws.readyState === WebSocket.OPEN &&
        ws.user?.id === recipientId
      ) {
        ws.send(payload);
      }
    }
  }

  /**
   * Broadcast task updated event so active project boards update in real time
   */
  broadcastTaskUpdate(projectId: string, task: any): void {
    const payload = JSON.stringify({
      type: 'TASK_UPDATED',
      data: { projectId, task },
    });

    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN && ws.user) {
        // Broadcast to admin, project owner, or assigned developer
        const isTarget =
          ws.user.role === 'ADMIN' ||
          task.project?.ownerId === ws.user.id ||
          task.assignedToId === ws.user.id;

        if (isTarget) {
          ws.send(payload);
        }
      }
    }
  }
}

export const wsManager = new WebSocketManager();
