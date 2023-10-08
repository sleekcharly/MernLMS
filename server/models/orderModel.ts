/* model for managing order */

// import dependencies
import mongoose, { Document, Model, Schema } from 'mongoose';

/* setup interfaces */

//order interface
export interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: object;
}

const orderSchema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
      // required: true
    },
  },
  { timestamps: true },
);

// create and export order model
const OrderModel: Model<IOrder> = mongoose.model('Order', orderSchema);

export default OrderModel;
