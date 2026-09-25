// Base type definitions shared across server modules

export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Augment Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
