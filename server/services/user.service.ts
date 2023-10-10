/* utility for managing user data*/

// import dependencies
import { Response } from 'express';
import { redis } from '../utils/redis';
import userModel from '../models/user.model';

// get user by user id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);

  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: 'true',
      user,
    });
  }
};

// Get all users
export const getAllUsersService = async (res: Response) => {
  // get all users from database
  const users = await userModel.find().sort({ createdAt: -1 });

  // send response to frontend
  res.status(201).json({
    success: true,
    users,
  });
};

// update user role service
export const updateUserRoleServices = async (
  res: Response,
  id: string,
  role: string,
) => {
  // update role and retrieve user from database
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });

  // return response with user object
  res.status(201).json({
    success: true,
    user,
  });
};
