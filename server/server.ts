// bring app
import { app } from './app';
import connectDB from './utils/db';

// initiate dotenv to use environment variables
require('dotenv').config();

// create server
app.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);

  // connect to database
  connectDB();
});
