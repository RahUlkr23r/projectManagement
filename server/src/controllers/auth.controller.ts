import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

const REFRESH_COOKIE_NAME = 'jid';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Store refresh token in HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        200,
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const result = await authService.register({ name, email, password, role });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201,
        'Account registered successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies[REFRESH_COOKIE_NAME];
      const result = await authService.refreshToken(token);

      // Rotate refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        200,
        'Token refreshed'
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies[REFRESH_COOKIE_NAME];
      await authService.logout(token, req.user?.id);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        path: '/',
      });

      sendSuccess(res, null, 200, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const user = await authService.getMe(req.user.id);
      sendSuccess(res, { user }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
