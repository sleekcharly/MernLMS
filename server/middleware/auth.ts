/* Authentication middleware */
// import dependencies
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from './catchAsyncErrors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import ErrorHandler from '../utils/ErrorHandler';
import { redis } from '../utils/redis';

// check if user is  authenticated before proceeding on resource
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // get access token from cookies
    const access_token = req.cookies.access_token;

    // return error if no access_token
    if (!access_token) {
      return next(new ErrorHandler('access token is not valid', 400));
    }

    // decode access_token with jwt
    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string,
    ) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler('access token is not valid', 400));
    }

    // get user details from redis
    const user = await redis.get(decoded.id);

    // if user does not exist in redis return error
    if (!user) {
      return next(
        new ErrorHandler('Please login to access this resource', 400),
      );
    }

    // set user in req object
    req.user = JSON.parse(user);

    next();
  },
);

// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource`,
          403,
        ),
      );
    }
    next();
  };
};
