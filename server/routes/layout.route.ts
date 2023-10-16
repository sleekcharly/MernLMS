/** Routes for layout */

// import dependencies
import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from '../controllers/layout.controller';

// initialize router
const layoutRouter = express.Router();

// routes
layoutRouter.post(
  '/create-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  createLayout,
);

layoutRouter.put(
  '/edit-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  editLayout,
);

layoutRouter.get('/get-layout', getLayoutByType);
export default layoutRouter;
