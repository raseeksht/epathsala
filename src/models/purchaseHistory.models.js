import { Schema, model } from "mongoose";

const purchaseHistorySchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
  },
  { timestamps: true }
);
