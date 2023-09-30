/* router configuration for user controller */

// import dependencies
import express from 'express';
import {
  activateUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/user.controller';

// assign router to userRouter variable
const userRouter = express.Router();

// define routes
userRouter.post('/registration', registerUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', logoutUser);

export default userRouter;
