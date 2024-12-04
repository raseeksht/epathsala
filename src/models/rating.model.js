import mongoose, { Schema, model } from "mongoose";

const ratingSchema = Schema({
  rated_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

ratingSchema.index({ rated_by: 1, course: 1 }, { unique: true });

const ratingModel = model("Rating", ratingSchema);

export { ratingModel };
