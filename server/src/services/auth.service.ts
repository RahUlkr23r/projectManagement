import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { BadRequestError, UnauthorizedError } from '../errors/AppError';
import {
  signAccessToken,
  generateRefreshTokenString,
  hashToken,
} from '../utils/jwt';
import { env } from '../config/env';
import { AuthenticatedUser, UserRole } from '../types';

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const accessToken = signAccessToken(authenticatedUser);
    const { rawToken, hashedToken } = generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, hashedToken, expiresAt);

    return {
      user: authenticatedUser,
      accessToken,
      refreshToken: rawToken,
    };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: (data.role as any) || 'DEVELOPER',
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const accessToken = signAccessToken(authenticatedUser);
    const { rawToken, hashedToken } = generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, hashedToken, expiresAt);

    return {
      user: authenticatedUser,
      accessToken,
      refreshToken: rawToken,
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const hashedToken = hashToken(rawRefreshToken);
    const storedToken = await tokenRepository.findValidToken(hashedToken);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Token rotation: Revoke current refresh token before issuing a new one
    await tokenRepository.revokeToken(storedToken.id);

    const user = await userRepository.findById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedError('User does not exist');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    const newAccessToken = signAccessToken(authenticatedUser);
    const { rawToken: newRawToken, hashedToken: newHashedToken } = generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRY_DAYS);

    await tokenRepository.createRefreshToken(user.id, newHashedToken, expiresAt);

    return {
      user: authenticatedUser,
      accessToken: newAccessToken,
      refreshToken: newRawToken,
    };
  }

  async logout(rawRefreshToken?: string, userId?: string): Promise<void> {
    if (rawRefreshToken) {
      const hashed = hashToken(rawRefreshToken);
      const token = await tokenRepository.findValidToken(hashed);
      if (token) {
        await tokenRepository.revokeToken(token.id);
      }
    } else if (userId) {
      await tokenRepository.revokeAllUserTokens(userId);
    }
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };
  }
}

export const authService = new AuthService();
