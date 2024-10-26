import asyncHandler from "express-async-handler";
import likeModel from "../models/like.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import postModel from "../models/post.model.js";

const like_dislike_handler = async (
  action,
  postOrCommentRef,
  onPostOrCommentOrShare,
  user
) => {
  if (action !== "like" && action !== "dislike") {
    throw new ApiError(400, "action should be like or dislike");
  }
  const model = mongoose.model(onPostOrCommentOrShare);

  // check if post exists
  const post_or_video = await model.findOne({ _id: postOrCommentRef });
  if (!post_or_video) {
    throw new ApiError(404, "post does not exists");
  }

  let liked = await likeModel.findOne({
    liked_by: user._id,
    like_on_ref: postOrCommentRef,
  });
  if (action == "like") {
    // if already liked send liked response else like the  post or video then send response
    if (!liked) {
      const data = {
        liked_by: user._id,
        like_on_ref: postOrCommentRef,
        like_on: onPostOrCommentOrShare,
      };
      liked = await likeModel.create(data);

      // increase number of like by 1
      const haude = await model.findOneAndUpdate(
        { _id: postOrCommentRef },
        { $inc: { likes: 1 } },
        { new: true }
      );
    }
    if (liked) {
      return new ApiResponse(200, "Liked");
    } else {
      throw new ApiError(500, `Failed to like this ${onPostOrCommentOrShare}`);
    }
  } else {
    // dislike
    if (liked) {
      // already liked? dcrease like counter and remove record
      const haude = await model.findOneAndUpdate(
        { _id: postOrCommentRef },
        { $inc: { likes: -1 } },
        { new: true }
      );
      let dislike = await likeModel.deleteOne({
        liked_by: user._id,
        like_on_ref: postOrCommentRef,
      });
    }
    return new ApiResponse(200, "DisLiked");
  }
};

const like_dislike_post_handler = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const { action } = req.body;

  const result = await like_dislike_handler(action, postId, "post", req.user);
  res.status(result.statusCode).json(result);
});

const like_dislike_video_handler = asyncHandler(async (req, res) => {
  const videoId = req.params.commentId;
  const { action } = req.body;
  const result = await like_dislike_handler(action, videoId, "video", req.user);
  console.log(result);
  res.json(result);
  res.status(result.status).json(result.response);
});

const likedPostOrVideo = asyncHandler(async (req, res) => {
  const postOrCommentId = req.params.postOrCommentId;
  const likes = await likeModel
    .find({ pc_ref: postOrCommentId })
    .populate("liked_by", "firstName lastName profilePic");
  res.json(likes);
});

export {
  like_dislike_post_handler,
  like_dislike_video_handler,
  likedPostOrVideo,
};
