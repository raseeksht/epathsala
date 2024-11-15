import { Schema, model } from "mongoose";

const userCourseEnrollSchema = Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
  },
  enrollDate: {
    type: Schema.Types.Date,
    required: true,
  },
  expiryDate: {
    type: Schema.Types.Date,
    required: true,
  },
  totalFee: {
    type: Number,
    required: true,
  },
  txnId: {
    type: String,
    required: true,
  },
});

const userCourseEnrollModel = model("UserCourseEnroll", userCourseEnrollSchema);

export { userCourseEnrollModel };
