// Set up middleware for handling errors and exceptions

// bring in the error handler class
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/ErrorHandler';

export const ErrorMiddleWare = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // wrong mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyvalue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // wrong jwt error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Json web token is invalid, try again';
    err = new ErrorHandler(message, 400);
  }

  // Jwt expired error
  if (err.name == 'TokenExpiredError') {
    const message = 'Json web token is expired, try again';
    err = new ErrorHandler(message, 400);
  }

  // response object
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
