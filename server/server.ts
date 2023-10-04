// bring app
import { app } from './app';
// import dependencies
import connectDB from './utils/db';
import { v2 as cloudinary } from 'cloudinary';

// initiate dotenv to use environment variables
require('dotenv').config();

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

// create server
app.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);

  // connect to database
  connectDB();
});
