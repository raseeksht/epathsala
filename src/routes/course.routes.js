import { Router } from "express";
import validateUser, { optionalValidation } from "../middlewares/userAuth.middlewares.js";
import {
  addCourse,
  courseFilterSearch,
  deleteCourse,
  editCourse,
  getAllCourseByUser,
  getCourse,
  getMyCourse,
  getSuggestedCourse
} from '../controllers/course.controllers.js';

import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import enrollRoute from "./enroll.routes.js";

const router = Router();

router.use("/enroll", enrollRoute);

router.get("/search",optionalValidation, courseFilterSearch);
router.get("/get-all-couse-by-user/:userId", getAllCourseByUser);

router.get("/mycourses", validateUser("teacher"), getMyCourse);

// cosine similarity
router.get("/recommended",validateUser('any'),getSuggestedCourse);

router.post(
  "/",
  validateUser("teacher"),
  fieldValidator([
    "title",
    "subTitle",
    "level",
    "category",
    "description",
    "thumbnail",
    "price",
  ]),
  addCourse
);

router.get("/:_id",optionalValidation, getCourse);

router.put("/:_id", validateUser("teacher"), editCourse);

router.delete("/:_id", validateUser("teacher"), deleteCourse);

export default router;
