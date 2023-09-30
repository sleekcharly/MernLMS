// controller code for users

// import dependencies
require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import userModel, { IUser } from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import { CatchAsyncError } from '../middleware/catchAsyncErrors';
import jwt, { Secret } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendMail from '../utils/sendMail';
import { sendToken } from '../utils/jwt';

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
      res.cookie('acces_token', '', { maxAge: 1 });
      res.cookie('refresh_token', '', { maxAge: 1 });
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
