import express from "express";
// import postModel from "../models/postModel.js";
import validateUser from "../middleware/validateUser.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import { createPost, fetchPosts, editPost, deletePost } from "../controllers/post.controllers.js";

const router = express.Router();

// creating post required either content or picture monitored in createPost()
router.post("/", validateUser, createPost)
router.get("/", fetchPosts)

router.put("/:postId", validateUser, editPost)

router.delete("/:postId", validateUser, deletePost);

export default router;