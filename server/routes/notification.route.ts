// routes for notifications api

// import dependencies
import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  getNotifications,
  updateNotification,
} from '../controllers/notification.controller';

// initialize router
const notificationRouter = express.Router();

// routes
notificationRouter.get(
  '/get-all-notifications',
  isAuthenticated,
  authorizeRoles('admin'),
  getNotifications,
);

notificationRouter.put(
  '/update-notifications/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  updateNotification,
);

export default notificationRouter;
