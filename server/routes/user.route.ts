/* router configuration for user controller */

// import dependencies
import express from 'express';
import { registerUser } from '../controllers/user.controller';

// assign router to userRouter variable
const userRouter = express.Router();

// define routes
userRouter.post('/registration', registerUser);

export default userRouter;
