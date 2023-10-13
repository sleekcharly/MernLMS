/** routes for analytics **/

// import dependencies
import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  getCoursesAnalytics,
  getOrdersAnalytics,
  getUsersAnalytics,
} from '../controllers/analytics.controller';

// initialize analytics router
const analyticsRouter = express.Router();

// routes
analyticsRouter.get(
  '/get-users-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getUsersAnalytics,
);
analyticsRouter.get(
  '/get-orders-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getOrdersAnalytics,
);

analyticsRouter.get(
  '/get-courses-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getCoursesAnalytics,
);

// export analyticsRouter
export default analyticsRouter;
