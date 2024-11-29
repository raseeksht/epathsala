import { Router } from "express";
import { courseModel } from "../models/course.model.js";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  studentDashboard,
  teacherDashboard,
} from "../controllers/dashboard.controllers.js";

const router = Router();

const getAllCourseByCreator = async (creatorId) => {
  return await courseModel.find({ creator: creatorId });
};

router.get("/teacher", validateUser("teacher"), teacherDashboard);

router.get("/student", validateUser("student"), studentDashboard);

export default router;
