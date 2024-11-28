import { Router } from "express";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import {
  checkCourseEnrollment,
  getEnrolledCourse,
  startEnroll,
} from "../controllers/enroll.controllers.js";
import validateUser from "../middlewares/userAuth.middlewares.js";

const router = Router();

router.get(
  "/check-enrollment/:courseId",
  validateUser("any"),
  checkCourseEnrollment
);

// organizationId as query parameter
// or allEnrolled
router.get(
  "/",
  // fieldValidator(["organizationId"], true),
  validateUser("any"),
  getEnrolledCourse
);

// router.post(
//   "/",
//   fieldValidator(["courses", "organizationId"]),
//   validateUser("any"),
//   enrollInCourse
// );

router.post(
  "/startenroll",
  fieldValidator(["courses", "paymentMethod"]),
  validateUser("any"),
  startEnroll
);

export default router;
