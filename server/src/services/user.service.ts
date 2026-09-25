import { userRepository } from '../repositories/user.repository';
import { Role } from '@prisma/client';

export class UserService {
  async getAllUsers(role?: Role) {
    return userRepository.findAll(role);
  }

  async getDevelopers() {
    return userRepository.findAll(Role.DEVELOPER);
  }
}

export const userService = new UserService();
