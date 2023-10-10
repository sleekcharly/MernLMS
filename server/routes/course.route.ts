// router for courses

// import dependencies
import express from 'express';
import {
  addAnswer,
  addQuestion,
  addReview,
  editCourse,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  replyToReview,
  uploadCourse,
  getCourses,
} from '../controllers/course.controller';

//  middlewares
import { authorizeRoles, isAuthenticated } from './../middleware/auth';

// initialize router object
const courseRouter = express.Router();

// routes
courseRouter.post(
  '/create-course',
  isAuthenticated,
  authorizeRoles('admin'),
  uploadCourse,
);

courseRouter.put(
  '/edit-course/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  editCourse,
);
// retrieving courses not purchased
courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/get-courses', getCourses);

courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser);

courseRouter.put('/add-question', isAuthenticated, addQuestion);

courseRouter.put('/add-answer', isAuthenticated, addAnswer);

courseRouter.put('/add-review/:id', isAuthenticated, addReview);

courseRouter.put(
  '/add-reply',
  isAuthenticated,
  authorizeRoles('admin'),
  replyToReview,
);

courseRouter.get(
  '/get-all-courses',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllCourses,
);

// export router
export default courseRouter;
