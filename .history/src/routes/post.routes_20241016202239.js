import express from "express";
// import postModel from "../models/postModel.js";
import validateUser from "../middleware/validateUser.js";
import fieldValidator from "../middleware/fieldValidator.js";
import { createPost, fetchPosts, editPost, deletePost } from "../controllers/post.controllers.js";
import shareRoute from "./shareRoute.js";

const router = express.Router();

// creating post required either content or picture monitored in createPost()
router.use("/share", validateUser, shareRoute);
router.post("/", validateUser, createPost)
router.get("/", fetchPosts)

router.put("/:postId", validateUser, editPost)

router.delete("/:postId", validateUser, deletePost);

export default router;