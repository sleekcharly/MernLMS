/*** Model for managing course data ***/

// import dependencies
import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUser } from './user.model';

/* setup required interfaces for course model structure */
// comment interface
interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies?: IComment[];
}

// reviews interface
interface IReview extends Document {
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}

// interface for links
interface ILink extends Document {
  title: string;
  url: string;
}

// interface for course data
interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: string;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
}

// interface for course info
interface ICourse extends Document {
  name: string;
  description: string;
  price: number;
  estimatedPrice: number;
  thumbnail: object;
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

/* Course model schemas */
// reviews schema
const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
});

// Link Schema
const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

// Comment schema
const commentSchema = new Schema<IComment>({
  user: Object,
  question: String,
  questionReplies: [Object],
});

// Course Data Schema
const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
});

// course schema
const courseSchema = new Schema<ICourse>(
  {
    name: {
      required: true,
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedPrice: {
      type: Number,
    },
    thumbnail: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tags: {
      required: true,
      type: String,
    },
    level: {
      type: String,
      required: true,
    },
    demoUrl: {
      type: String,
      required: true,
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// define and export course model
const CourseModel: Model<ICourse> = mongoose.model('course', courseSchema);
export default CourseModel;
