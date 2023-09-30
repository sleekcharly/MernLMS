// declare types for Request object in express
import { Request } from 'express';
import { IUser } from '../models/user.model';

// declare global interface
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
