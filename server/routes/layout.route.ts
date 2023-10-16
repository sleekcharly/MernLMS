/** Routes for layout */

// import dependencies
import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { createLayout } from '../controllers/layout.controller';

// initialize router
const layoutRouter = express.Router();

// routes
layoutRouter.post(
  '/create-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  createLayout,
);

export default layoutRouter;
