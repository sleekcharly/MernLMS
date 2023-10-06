// router for courses

// import dependencies
import express from 'express';
import { editCourse, uploadCourse } from '../controllers/course.controller';

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

// export router
export default courseRouter;
