/** Utility for managing order data **/

// import dependencies
import { NextFunction, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import OrderModel from '../models/orderModel';

// create new order service
export const newOrder = CatchAsyncError(
  async (data: any, next: NextFunction, res: Response) => {
    const order = await OrderModel.create(data);

    // send response
    res.status(201).json({
      success: true,
      order,
    });
  },
);

// get all orders
export const getAllOrdersService = async (res: Response) => {
  // get all orders from database
  const orders = await OrderModel.find().sort({ createdAt: -1 });

  // send response to frontend
  res.status(201).json({
    success: true,
    orders,
  });
};
