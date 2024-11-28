import { Schema, model } from "mongoose";

const userCourseEnrollSchema = Schema(
  {
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
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    enrollDate: {
      type: Schema.Types.Date,
      required: true,
    },
    expiryDate: {
      type: Schema.Types.Date,
      required: false,
    },
    totalFee: {
      type: Number,
      required: true,
    },
    txnId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const userCourseEnrollModel = model("UserCourseEnroll", userCourseEnrollSchema);

export { userCourseEnrollModel };
