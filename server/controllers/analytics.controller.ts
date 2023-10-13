/** controller for managing analytics actions */

// import dependencies
import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import userModel from '../models/user.model';
import { generateLast12MonthsData } from '../utils/analyticsGenerator';
import CourseModel from '../models/course.model';
import OrderModel from '../models/orderModel';

// user data analytics -- only admin
export const getUsersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get users analytics
      const users = await generateLast12MonthsData(userModel);

      // return response to frontend
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// course data analytics
export const getCoursesAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get users analytics
      const courses = await generateLast12MonthsData(CourseModel);

      // return response to frontend
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// order data analytics
export const getOrdersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get users analytics
      const orders = await generateLast12MonthsData(OrderModel);

      // return response to frontend
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
