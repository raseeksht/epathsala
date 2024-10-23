import { Router } from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import { addCourse } from "../controllers/course.controllers.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";

const router = Router();

router.post("/", validateUser('teacher'), fieldValidator(['name', 'courseId', 'creditHr', 'organization']), addCourse);


export default router;