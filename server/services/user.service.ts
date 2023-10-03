/* utility for managing user data*/

// import dependencies
import { Response } from 'express';
import userModel from '../models/user.model';

// get user by user id
export const getUserById = async (id: string, res: Response) => {
  const user = await userModel.findById(id);
  res.status(201).json({
    success: 'true',
    user,
  });
};
