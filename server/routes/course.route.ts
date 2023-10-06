// router for courses

// import dependencies
import express from 'express';
import {
  editCourse,
  getAllCourses,
  getSingleCourse,
  uploadCourse,
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
courseRouter.get('/get-courses', getAllCourses);

// export router
export default courseRouter;
