import { activityRepository } from '../repositories/activity.repository';
import { AuthenticatedUser } from '../types';
import { Role } from '@prisma/client';

export class ActivityService {
  async getRecentActivity(
    user: AuthenticatedUser,
    limit = 20,
    projectId?: string
  ): Promise<any[]> {
    return activityRepository.findRecentActivityForUser(
      user.id,
      user.role as Role,
      limit,
      projectId
    );
  }
}

export const activityService = new ActivityService();
