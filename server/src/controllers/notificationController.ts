import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/response';
import { RequestWithUser } from '../types';

export class NotificationController {
  async getNotifications(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const unreadOnly = req.query.unread === 'true';
      const result = await notificationService.getUserNotifications(
        req.user!.id,
        unreadOnly
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAsRead(String(req.params.id), req.user!.id);
      sendSuccess(res, { message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
