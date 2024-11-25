import { Router } from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  addCourse,
  deleteCourse,
  editCourse,
  getCourse,
} from "../controllers/course.controllers.js";

import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import enrollRoute from "./enroll.routes.js";

const router = Router();

router.use("/enroll", enrollRoute);

router.post(
  "/",
  validateUser("teacher"),
  fieldValidator([
    "name",
    "courseId",
    "creditHr",
    "organization",
    "pricePerMonth",
  ]),
  addCourse
);

router.get("/:_id", getCourse);

router.put("/:_id", validateUser("teacher"), editCourse);

router.delete("/:_id", validateUser("teacher"), deleteCourse);

export default router;
