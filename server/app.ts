// bring in dotenv to accept environment variables
require('dotenv').config();

// (1) setup express server
import express, { NextFunction, Request, Response } from 'express';

// (2) initialize express app
export const app = express();

// import dependencies
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ErrorMiddleWare } from './middleware/error';
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.route';
import notificationRouter from './routes/notification.route';
import analyticsRouter from './routes/analytics.route';

// body parser
app.use(express.json({ limit: '50mb' })); // important for using cloudinary.

// cookie parser (when sending cookies from the browser to the server)
app.use(cookieParser());

// use cors (restrict origin where the API can be hit)
app.use(
  cors({
    origin: process.env.ORIGIN,
  }),
);

/*routes*/
//route for registering new user
app.use('/api/v1', userRouter);
//route for managing course actions
app.use('/api/v1', courseRouter);
// route for managing order actions
app.use('/api/v1', orderRouter);
// route for managing notifications actions
app.use('/api/v1', notificationRouter);
// route for managing analytics
app.use('/api/v1', analyticsRouter);

// testing API
app.get('/test', (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: 'API is working',
  });
});

// unknown route
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// use the error middleware
app.use(ErrorMiddleWare);
