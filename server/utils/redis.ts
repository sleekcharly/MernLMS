// connection to Redis Database;
// import dependencies
import { Redis } from 'ioredis';

require('dotenv').config();

// get redis url if exists
const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log('Redis connected');
    return process.env.REDIS_URL;
  }

  // throw error if connection is not established
  throw new Error('Redis connection failed');
};

// export redis connection
export const redis = new Redis(redisClient());
