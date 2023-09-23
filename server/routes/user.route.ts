/* router configuration for user controller */

// import dependencies
import express from 'express';
import { activateUser, registerUser } from '../controllers/user.controller';

// assign router to userRouter variable
const userRouter = express.Router();

// define routes
userRouter.post('/registration', registerUser);
userRouter.post('/activate-user', activateUser);

export default userRouter;
