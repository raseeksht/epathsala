import { Router } from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  handleVideoUpload,
  checkProgress,
  getVideo,
} from "../controllers/video.controllers.js";
import path from "path";
import { createDirIfNotExists } from "../utils/utils.js";

// multer middleware
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await createDirIfNotExists("./uploads/raw");
    cb(null, "./uploads/raw");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      path.basename(file.originalname, path.extname(file.originalname)) +
        "-" +
        uuidv4() +
        path.extname(file.originalname)
    );
  },
});

// muter configuration
const upload = multer({ storage: storage });

const router = Router();

router.post(
  "/",
  validateUser("teacher"),
  //   fieldValidator(["video", "title", "description"]),
  upload.single("video"),
  handleVideoUpload
);

router.get(
  "/",
  validateUser("any"),
  fieldValidator(["courseId"], true),
  getVideo
);

router.get("/progress", validateUser("teacher"), checkProgress);

export default router;
