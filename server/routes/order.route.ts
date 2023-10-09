// import dependencies
import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { createOrder } from '../controllers/order.controller';

// initialize router
const orderRouter = express.Router();

// routes
orderRouter.post('/create-order', isAuthenticated, createOrder);

export default orderRouter;
