import asyncHandler from "express-async-handler";
import commentModel from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import postModel from "../models/post.model.js";
import { videoModel } from "../models/video.model.js";
import { courseModel } from "../models/course.model.js";

export const addComment = asyncHandler(async (req, res) => {
  // comment_on_id can be postId or videoID
  // parent_comment_ref can be null for root/main comment
  const { content, parent_comment_ref, comment_on, comment_on_ref } = req.body;

  if (!["post", "video", "course"].includes(comment_on))
    throw new ApiError(400, "comment_on should be either post or video");

  let referencedEntity;
  if (comment_on === "post") {
    referencedEntity = await postModel.findById(comment_on_ref);
  } else if (comment_on === "video") {
    referencedEntity = await videoModel.findById(comment_on_ref);
  } else if (comment_on === "course") {
    referencedEntity = await courseModel.findById(comment_on_ref);
  }

  if (!referencedEntity) {
    throw new ApiError(404, `Referenced ${comment_on} not found.`);
  }

  let comment = await commentModel.create({
    commentor: req.user._id,
    content,
    parent_comment_ref,
    likes: 0,
    comment_on,
    comment_on_ref: comment_on_ref,
  });

  if (comment) {
    res.json(new ApiResponse(201, "comment added", comment));
  } else {
    throw new ApiError(500, "Failed to add comment.");
  }
});

const getGroupedCommentAndReplies = async (
  comment_on_ref,
  parent_comment_ref = null
) => {
  const result = [];

  // didnt populate post_ref cause client would already have post detail if they have postId
  const mainComments = await commentModel
    .find({
      parent_comment_ref,
      comment_on_ref,
    })
    .populate("commentor", "username profilePic")
    .select("-comment_on_ref");
  for (const comment of mainComments) {
    const commentObj = {
      ...comment._doc,
      subComments: [],
    };
    const subComments = await getGroupedCommentAndReplies(
      comment_on_ref,
      comment._id
    );
    commentObj.subComments = subComments;
    result.push(commentObj);
  }
  return result;
};

export const fetchComment = asyncHandler(async (req, res) => {
  const comment_on_ref = req.query.comment_on_ref;
  const result = await getGroupedCommentAndReplies(comment_on_ref, null);
  res.json(result);
});

// DELETE:
export const removeComment = asyncHandler(async (req, res) => {
  const commentId = req.params.commentId;

  const comment = await commentModel.findOne({ _id: commentId });
  //   .populate({
  // path: "commentor",
  // select: "_id",
  // populate: {
  //   path: "creator",
  //   select: "_id",
  // },
  //   });
  if (!comment) {
    throw new ApiError(404, "Comment Already Deleted or does not exists");
  }

  // delete the comment if the requsting user is creator of the comment or post creator
  if (comment.commentor.equals(req.user._id)) {
    // if the comment to be deleted has replies. just empty content field and set deleted field to true
    // using this way, replies won't be effected and replies can still be visible.
    // delete whole commnet otherwise(if no replies)
    const replies = await commentModel.countDocuments({
      parent_comment_ref: commentId,
    });

    // const deleted = await commentModel.find({ _id: commentId })

    if (replies > 0) {
      comment.deleted = true; // indicate deleted by commentor or post owner
      comment.content = "(deleted message)";
      await comment.save();
    } else {
      await comment.deleteOne();
    }
    return res.json(
      new ApiResponse(204, "comment deleted successfully", comment)
    );
  } else {
    throw new ApiError(403, "Not Authorized to delete");
  }
});

export const editComment = asyncHandler(async (req, res) => {
  const commentId = req.params.commentId;
  const { content } = req.body;

  if (!content) {
    throw new ApiError("400", "comment seems to be missing");
  }

  const comment = await commentModel.findOne({ _id: commentId });
  if (!comment) {
    throw new ApiError(404, "Comment does not exists.");
  }
  if (comment.commentor.equals(req.user._id)) {
    const edited = await commentModel.findOneAndUpdate(
      { _id: commentId },
      { content: content, edited: true },
      { new: true }
    );
    if (edited) {
      res.json(new ApiResponse(204, "Comment Edited!", edited));
    } else {
      throw new ApiError(403, "Edit failed");
    }
  } else {
    throw new ApiError(403, "Not allowed to edit others comment");
  }
});
