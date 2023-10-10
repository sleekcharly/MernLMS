// controller code for users

// import dependencies
require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import userModel, { IUser } from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from '../utils/jwt';
import { redis } from '../utils/redis';
import {
  getAllUsersService,
  getUserById,
  updateUserRoleServices,
} from '../services/user.service';
import cloudinary from 'cloudinary';

// register User interface
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// register user function
export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get request body parameters
      const { name, email, password } = req.body;

      // check if the entered email already exists on the server
      const emailExist = await userModel.findOne({ email });
      if (emailExist) {
        return next(new ErrorHandler('Email already exist', 400));
      }

      // define user object
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      // define activation token
      const activationToken = createActivationToken(user);
      //   get activation code form token object
      const activationCode = activationToken.activationCode;

      // define user data object
      const data = { user: { name: user.name }, activationCode };
      console.log(data);

      // send data to user email
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        data,
      );

      try {
        await sendMail({
          email: user.email,
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// interface for activation token
interface IActivationToken {
  token: string;
  activationCode: string;
}

// create function for token creation
export const createActivationToken = (user: any): IActivationToken => {
  // get four digit code
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: '5m' },
  );

  return { token, activationCode };
};

/* activate user */
// create an interface for request
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

// function for user activation
export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string,
      ) as { user: IUser; activationCode: string };

      const { name, email, password } = newUser.user;

      const userExist = await userModel.findOne({ email });

      if (userExist) {
        return next(new ErrorHandler('Email already exists', 400));
      }

      const user = await userModel.create({ email, name, password });

      res.status(201).json({ success: true });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

/* Login User */
// interface for login
interface ILoginRequest {
  email: string;
  password: string;
}

// function for user login
export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get email and password from request body
      const { email, password } = req.body as ILoginRequest;

      // check if user entered email or password
      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
      }

      // get user
      const user = await userModel.findOne({ email }).select('+password');

      // check if user exists
      if (!user) {
        return next(new ErrorHandler('Invalid email or password', 400));
      }

      // check if password is correct
      const passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return next(new ErrorHandler('Invalid email or password', 400));
      }

      //   send user token and details to redis
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// function for logging out user.
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 });
      res.cookie('refresh_token', '', { maxAge: 1 });

      //   delete user from redis
      const userId = req.user?._id || '';
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string,
      ) as JwtPayload;

      const message = 'Could not refresh token';
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }

      //   get the user session
      const session = await redis.get(decoded.id as string);

      // return error message if session does not exist
      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      //   get the user object from the session
      const user = JSON.parse(session);

      // sign new access token
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        {
          expiresIn: '5m',
        },
      );

      //  create refresh token
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        {
          expiresIn: '3d',
        },
      );

      // set user in  request object
      req.user = user;

      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      // send response
      res.status(200).json({
        status: 'success',
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get user info
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// interface for social authentication
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

// social authentication
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });

      // create user if user does not exist
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        // send authenticated user if user exists
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// section for updating user info
// setup interface
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

// update userInfo function
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      // update email
      if (email && user) {
        const emailExists = await userModel.findOne({ email });
        if (emailExists) {
          return next(new ErrorHandler('Email already exist', 400));
        }
        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      // update redis database
      await redis.set(userId, JSON.stringify(user));

      // user as response
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update user password functionality
// setup interface
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // retrieve password from request body
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      // check if passwords were entered
      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Please enter old and new password', 400));
      }

      // get user info from database
      const user = await userModel.findById(req.user?._id).select('password');

      //  user password validation
      if (user?.password === undefined) {
        return next(new ErrorHandler('Invalid user', 400));
      }

      // check if password matches
      const passwordMatch = await user?.comparePassword(oldPassword);

      if (!passwordMatch) {
        return next(new ErrorHandler('Invalid old password', 400));
      }

      // update user password
      user.password = newPassword;

      // save new user password to database
      await user.save();

      // update the redis client
      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Updating user picture or avatar
// setup interface
interface IUpdateProfilePicture {
  avatar: string;
}

// update profile picture
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get avatar string from request body
      const { avatar } = req.body;

      // get user
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      // upload profile picture
      if (avatar && user) {
        if (user?.avatar?.public_id) {
          // destroy existing user avatar in cloudinary
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

          // get cloudinary object after image upload
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });

          // save avatar to request user object
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          // get cloudinary object after image upload
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });

          // save avatar to request user object
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      // save user details to mongo database
      await user?.save();

      // save user data to redis
      await redis.set(userId, JSON.stringify(user));

      // send response
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get all users --- only for admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get all users
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update user role -- only for admin
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get id and role form request body
      const { id, role } = req.body;

      // update user role
      updateUserRoleServices(res, id, role);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// delete user -- only admin
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get id from request params
      const { id } = req.params;

      // get user from database
      const user = await userModel.findById(id);

      // return error message if user does not exist
      if (!user) {
        return next(new ErrorHandler('User not found', 404));
      }

      // delete user from database
      await user.deleteOne({ id });

      // delete user from redis
      await redis.del(id);

      // return response to frontend
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
