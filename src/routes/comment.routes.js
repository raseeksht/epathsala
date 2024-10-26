import express from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  addComment,
  editComment,
  fetchComment,
  removeComment,
} from "../controllers/comment.controllers.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";

const router = express.Router();

// add comment to post
router.post(
  "/",
  validateUser("any"),
  fieldValidator(["content", "comment_on", "comment_on_ref"]),
  addComment
);

// fetch comments for specific post or video
router.get("/", fetchComment);

// delete comment
router.delete("/:commentId", validateUser("any"), removeComment);

// edit commnet
router.put("/:commentId", validateUser("any"), editComment);

export default router;
