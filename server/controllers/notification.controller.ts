/* controller for controlling notification actions */

// import dependencies
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import NotificationModel from '../models/notificationModel';

// get al notifications - only for admin users
export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get all sorted notifications from database
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      // send response to frontend
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// update notifications status --- only admin
export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // receive the notifications id
      const notification = await NotificationModel.findById(req.params.id);

      // update status
      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404));
      } else {
        notification.status
          ? (notification.status = 'read')
          : notification?.status;
      }

      // save notification
      await notification?.save();

      // get notifications
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      // return response to frontend
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
