import express from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import {
  like_dislike_post_handler,
  like_dislike_video_handler,
  likedPostOrVideo,
} from "../controllers/likes.controllers.js";
// import {
//   like_dislike_video_handler,
//   like_dislike_post_handler,
//   likedPostOrVideo,
// } from "../controllers/like.controllers.js";

const router = express.Router();

// like a post or comment
//action= "like" or "unlike"

router.post(
  "/post/:postId",
  fieldValidator(["action"]),
  validateUser("any"),
  like_dislike_post_handler
);

router.post(
  "/video/:videoId",
  fieldValidator(["action"]),
  validateUser("any"),
  like_dislike_video_handler
);

router.get("/postorcomment/:postOrCommentId", likedPostOrVideo);

// router.get("/comment/:commentId", likedComment);

export default router;
