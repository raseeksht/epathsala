import asyncHandler from "express-async-handler";
import { ratingModel } from "../models/rating.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { courseModel } from "../models/course.model.js";

const addRating = asyncHandler(async (req, res) => {
  const { star, course } = req.body;
  const oldRating = await ratingModel.findOne({
    course,
    rated_by: req.user._id,
  });
  const course1 = await courseModel.findOne({ _id: course });
  let newAvgRating;
  if (!oldRating) {
    const newRating = await ratingModel.create({
      course: course,
      rated_by: req.user._id,
      rating: star,
    });
    newAvgRating =
      (course1.averageRating * course1.totalReview + star) /
      (course1.totalReview + 1);
    course1.totalReview = course1.totalReview + 1;
  } else {
    console.log(course1.averageRating);
    if (oldRating.rating == star)
      return res.json(new ApiResponse(200, "Same Rating?"));
    // if user has already rated this course just update the course
    const updateRating = await ratingModel.updateOne(
      { _id: oldRating._id },
      { rating: star }
    );
    newAvgRating =
      (course1.averageRating * course1.totalReview - oldRating.rating + star) /
      course1.totalReview;
    // console.log(newAvgRating,totalReview);
  }
  course1.averageRating = newAvgRating;

  const saved = await course1.save();
  if (oldRating) {
    res.json(new ApiResponse(201, "Rating Saved!", saved));
  } else {
    res.json(new ApiResponse(200, "Rating updated!", saved));
  }
});

const getUserRatings = asyncHandler(async (req, res) => {
  const myRatings = await ratingModel.find({ rated_by: req.user._id });
  res.json(new ApiResponse(200, "Here are your ratings.", myRatings));
});

export { addRating, getUserRatings };
