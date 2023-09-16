// connection to mongoDB database

// enable dotenv for  environment variables
require('dotenv').config();

// import dependencies
import mongoose from 'mongoose';

// set database url
const dbUrl: string = process.env.DB_URL || '';

// connect to mongo database
const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl).then((data: any) => {
      console.log(`Database connected with ${data.connection.host}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

// export database file
export default connectDB;
