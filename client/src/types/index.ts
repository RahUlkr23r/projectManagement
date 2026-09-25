export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_IN_REVIEW' | 'TASK_OVERDUE' | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  ownerId: string;
  createdAt: string;
  client: Client;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  assignedToId?: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
    ownerId?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ActivityLog {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: Role;
  };
  task?: {
    id: string;
    title: string;
    taskNumber: number;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface AppNotification {
  id: string;
  userId: string;
  taskId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    taskNumber: number;
  };
}
