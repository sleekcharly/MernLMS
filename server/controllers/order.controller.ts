/** controller for managing order actions */

// import dependencies
import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { IOrder } from '../models/orderModel';
import userModel from '../models/user.model';
import CourseModel from '../models/course.model';
import { newOrder } from '../services/order.service';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import NotificationModel from '../models/notificationModel';

// create order callback
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from request body
      const { courseId, payment_info } = req.body as IOrder;

      // get user from mongodb
      const user = await userModel.findById(req.user?._id);

      // check if course already exists in user's course list
      const courseExistInUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId,
      );

      // return error message if course exist
      if (courseExistInUser) {
        return next(
          new ErrorHandler('You have already purchased tis course', 400),
        );
      }

      // get course from mongo
      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // define data object
      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      // send a mail
      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          data: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
      };

      // create html
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/order-confirmation.ejs'),
        { order: mailData },
      );

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: 'Order confirmation',
            template: 'order-confirmation.ejs',
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      // update user courses
      user?.courses.push(course?._id);

      // save user data
      await user?.save();

      // send notification to admin
      await NotificationModel.create({
        user: user?._id,
        title: 'New order',
        message: `You have a new order from ${course?.name}`,
      });

      // update purchased info
      course.purchased ? (course.purchased += 1) : course.purchased;

      // save to database
      await course.save();

      // create order
      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
