import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful', 200);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, { message: 'Logged out successfully' }, 'Logged out', 200);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await authService.updateMe(req.user!.id, req.body);
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async adminGetUsers(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.adminGetUsers({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        role: req.query.role as string,
        status: req.query.status as string,
        search: req.query.search as string,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async adminGetUserById(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.adminGetUserById(String(req.params.id));
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async adminCreateUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const newUser = await authService.adminCreateUser(req.body, req.user!.id);
      sendSuccess(res, newUser, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async adminUpdateUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await authService.adminUpdateUser(
        String(req.params.id),
        req.body,
        req.user!.id
      );
      sendSuccess(res, updated, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async adminDeleteUser(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const force = req.query.force === 'true';
      const result = await authService.adminDeleteUser(
        String(req.params.id),
        req.user!.id,
        force
      );
      sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  async adminUpdateUserStatus(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await authService.adminUpdateUserStatus(
        String(req.params.id),
        req.body.status,
        req.user!.id
      );
      sendSuccess(res, updated, `User status updated to ${req.body.status}`);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
