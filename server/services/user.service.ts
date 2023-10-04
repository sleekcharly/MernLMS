/* utility for managing user data*/

// import dependencies
import { Response } from 'express';
import { redis } from '../utils/redis';

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
