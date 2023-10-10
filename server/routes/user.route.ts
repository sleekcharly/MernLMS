import { authorizeRoles, isAuthenticated } from './../middleware/auth';
/* router configuration for user controller */

// import dependencies
import express from 'express';
import {
  activateUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
} from '../controllers/user.controller';

// assign router to userRouter variable
const userRouter = express.Router();

// define routes
userRouter.post('/registration', registerUser);
userRouter.post('/activate-user', activateUser);
userRouter.post('/login', loginUser);
userRouter.get('/logout', isAuthenticated, logoutUser);
userRouter.get('/refresh', updateAccessToken);
userRouter.get('/me', isAuthenticated, getUserInfo);
userRouter.post('/social-auth', socialAuth);
userRouter.put('/update-user-info', isAuthenticated, updateUserInfo);
userRouter.put('/update-password', isAuthenticated, updatePassword);
userRouter.put('/update-user-avatar', isAuthenticated, updateProfilePicture);
userRouter.get(
  '/get-users',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllUsers,
);

export default userRouter;
