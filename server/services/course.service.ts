/* utility for managing course data */

// import dependencies
import { Response } from 'express';
import CourseModel from '../models/course.model';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';

// create course
export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    // get course data after creation
    const course = await CourseModel.create(data);
    res.status(201).json({
      success: true,
      course,
    });
  },
);

// Get all courses
export const getAllCoursesService = async (res: Response) => {
  // get all users from database
  const courses = await CourseModel.find().sort({ createdAt: -1 });

  // send response to frontend
  res.status(201).json({
    success: true,
    courses,
  });
};
