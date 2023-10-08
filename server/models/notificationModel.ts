/* Model for managing notifications */

// import dependencies
import mongoose, { Document, Model, Schema } from 'mongoose';

// set up interface
export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: string;
}

// set up schema
const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'unread',
    },
  },
  { timestamps: true },
);

// make notification model
const NotificationModel: Model<INotification> = mongoose.model(
  'Notification',
  notificationSchema,
);

export default NotificationModel;
