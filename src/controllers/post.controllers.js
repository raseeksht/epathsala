import asyncHandler from "express-async-handler";
import postModel from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPost = asyncHandler(async (req, res) => {
  const { content, picUrl, courseId } = req.body;
  if (!(content || picUrl)) {
    throw new ApiError(400, "content or picUrl required to create post");
  }
  if (!courseId) {
    throw new ApiError(400, "courseId required");
  }

  const data = {
    author: req.user._id,
    content,
    picUrl,
    post_on: courseId,
  };
  const post = await postModel.create(data);

  const populated = await post.populate([
    {
      path: "author",
      select: "firstName lastName email profilePic",
    },
  ]);
  res.json(new ApiResponse(201, "Post created!", populated));
});

const fetchPosts = asyncHandler(async (req, res) => {
  const posts = await postModel.find().populate({
    path: "author",
    select: "firstName lastName email profilePic",
  });
  res.json(new ApiResponse(200, "Here goes your posts", posts));
});

const editPost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const { content, picUrl } = req.body;
  if (!(content || picUrl)) {
    throw new ApiError(400, "content or picUrl required to edit post");
  }

  const updateQuery = {
    content: content || undefined,
    picUrl: picUrl || undefined,
    edited: true,
  };
  const post = await postModel
    .findOneAndUpdate({ _id: postId, author: req.user._id }, updateQuery, {
      new: true,
    })
    .populate({
      path: "author",
      select: "firstName lastName profilePic",
    });
  if (!post) {
    throw new ApiError(400, "Invalid Modification. Not your post to edit");
  }
  res.json(new ApiResponse(200, "Post updated", post));
});

const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  //   const post1 = await postModel.findOne({ _id: postId });

  const post = await postModel.findOneAndDelete({
    _id: postId,
    author: req.user._id,
  });
  if (post) {
    res.json(new ApiResponse(200, "Selected Post deleted successfully", post));
  } else {
    // either post doesn't exists for the requesting person is not creator
    throw new ApiError(400, "Invalid postId OR Not Authorized to delete post");
  }
});

const getPostById = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const post = await postModel
    .findOne({ _id: postId })
    .populate("author", "username email");
  res.json(new ApiResponse(200, "the post you requested", post));
});

export { createPost, fetchPosts, editPost, deletePost, getPostById };
