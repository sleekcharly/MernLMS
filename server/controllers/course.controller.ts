/* controllers for managing course actions */

// import dependencies
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { createCourse, getAllCoursesService } from '../services/course.service';
import CourseModel from '../models/course.model';
import { redis } from '../utils/redis';
import mongoose from 'mongoose';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import NotificationModel from '../models/notificationModel';

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
        await redis.set(courseId, JSON.stringify(course), 'EX', 604800); // 7 days expiry

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
export const getCourses = CatchAsyncError(
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

// add question in course
// create interface for question
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get items from request body
      const { question, courseId, contentId }: IAddQuestionData = req.body;

      // get course from database
      const course = await CourseModel.findById(courseId);

      //return error if course id does not exist in mongodb database
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      // proceed if contentId is valid
      // get course content
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      // return error if course content does not exist
      if (!courseContent) {
        return next(new ErrorHandler('Invalid content', 400));
      }

      // proceed with question data
      //  create a new question
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      // add question to course content
      courseContent.questions.push(newQuestion);

      // push notification to database
      await NotificationModel.create({
        user: req.user?._id,
        title: 'New Question received',
        message: `You have a new question in ${courseContent.title}`,
      });

      // save the updated course
      await course?.save();

      // send response
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// add answering questions
// add interface
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // extract items from request body
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;

      // get course using id
      const course = await CourseModel.findById(courseId);

      // check if contentId is valid
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      // get course content if course exists
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      // return error if course content does not exist
      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      // get question
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId),
      );

      // return error if the question does not exist
      if (!question) {
        return next(new ErrorHandler('Invalid question id', 400));
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      // add answer to course content
      question.questionReplies?.push(newAnswer);

      // save course to mongodb
      await course?.save();

      // create notification if user id is equal to question user id
      if (req.user?._id === question.user._id) {
        // create notification
        await NotificationModel.create({
          user: req.user?._id,
          title: 'New Question Reply Received',
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {
        // send an email
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        // send email
        const html = await ejs.renderFile(
          path.join(__dirname, '../mails/question-reply.ejs'),
          data,
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: 'Question reply',
            template: 'question-reply.ejs',
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      // return response
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// add review to a course
// set up interface for controller.
interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get course list form request user's courseList
      const userCourseList = req.user?.courses;

      // get course Id from request parameters
      const courseId = req.params.id;

      // check if courseId already exists in userCourseList based on _id
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString(),
      );

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 404),
        );
      }

      // get course from mongo database
      const course = await CourseModel.findById(courseId);

      // get review data from request body
      const { review, rating } = req.body as IAddReviewData;

      // create review data object
      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      };

      // add review to course
      course?.reviews.push(reviewData);

      // calculate average rating
      let avg = 0;
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating;
      });
      if (course) {
        course.ratings = avg / course.reviews.length;
      }

      // save course to database
      await course?.save();

      // notification on review
      const notification = {
        title: 'New Review Received',
        message: `${req.user?.name} has given a review in ${course?.name}`,
      };

      //  create notification

      //send response to frontend
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// add reply to a review
// setup interface
interface IAddReviewReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}
export const replyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get data from request body
      const { comment, courseId, reviewId } = req.body as IAddReviewReplyData;

      // get course form mongodb
      const course = await CourseModel.findById(courseId);

      // return error if course is not found
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // get review from course
      const review = course?.reviews?.find(
        (rev: any) => rev._id.toString() === reviewId,
      );

      // return error if review is not found
      if (!review) {
        return next(new ErrorHandler('Review not found', 404));
      }

      // define reply data
      const replyData: any = {
        user: req.user,
        comment,
      };

      // create empty commentReplies array if non exists
      if (!review.commentReplies) {
        review.commentReplies = [];
      }

      // push reply data to reviews object
      review.commentReplies?.push(replyData);

      // save data to database
      await course?.save();

      // return response to frontend
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get all courses --- only admin
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// delete course -- only admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get id from params
      const { id } = req.params;

      // get course from database
      const course = await CourseModel.findById(id);

      //return error message if course is not found
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // delete course
      await course.deleteOne({ id });

      // delete course from redis
      await redis.del(id);

      // return response to frontend
      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
