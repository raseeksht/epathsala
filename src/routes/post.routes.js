import express from "express";
// import postModel from "../models/postModel.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  createPost,
  fetchPosts,
  editPost,
  deletePost,
  getPostById,
} from "../controllers/post.controllers.js";

const router = express.Router();

// creating post required either content or picture monitored in createPost()
router.post("/", validateUser("teacher"), createPost);
router.get("/", fetchPosts);

router.get("/:postId", validateUser("any"), getPostById);

router.put("/:postId", validateUser("teacher"), editPost);

router.delete("/:postId", validateUser("teacher"), deletePost);

export default router;
