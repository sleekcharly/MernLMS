/* controllers for managing course actions */

// import dependencies
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse } from '../services/course.service';
import CourseModel from '../models/course.model';
import { redis } from '../utils/redis';

// upload course functionality
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from request body
      const data = req.body;
      // extract thumbnail from data
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        // upload thumbnail to cloudinary
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secureUrl,
        };
      }

      // create course
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// edit course functionality
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from request body
      const data = req.body;

      // destroy and upload thumbnail if thumbnail exists in data
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.pubic_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        });

        // set new thumbnail in data
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      /* Update course data in mongodb database */
      // get course id from request parameters
      const courseId = req.params.id;

      // update and  return course from mongodb
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true },
      );

      // send response back to frontend
      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get a single course not purchased
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // retrieve and send course from redis if it exists
      const courseId = req.params.id;
      const courseCached = await redis.get(courseId);
      if (courseCached) {
        const course = JSON.parse(courseCached);
        // return course data to frontend
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        // retrieve course from database
        const course = await CourseModel.findById(req.params.id).select(
          '~courseData.videoUrl ~courseData.suggestion ~courseData.questions ~courseData.links',
        );

        // set data in redis database
        await redis.set(courseId, JSON.stringify(course));

        // return response data
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get all courses not purchased
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //  check if courses exists in the redis database
      const coursesCached = await redis.get('allCourses');
      if (coursesCached) {
        const courses = JSON.parse(coursesCached);
        res.status(200).json({ success: true, courses });
      } else {
        // get all courses not purchased
        const courses = await CourseModel.find().select(
          '~courseData.videoUrl ~courseData.suggestion ~courseData.questions ~courseData.links',
        );

        // set courses in redis database
        await redis.set('allCourses', JSON.stringify(courses));

        // send response
        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get course content - only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get user's courses list from request object
      const userCourseList = req.user?.courses;

      // get courseId from request parameters
      const courseId = req.params.id;

      // check if course exists in user's courses list
      const courseExists = userCourseList?.find(
        (course: any) => course._id.toString() === courseId,
      );
      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404),
        );
      }

      // retrieve course content if course exists
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;

      // return course data
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
