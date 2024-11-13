import { Router } from "express";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import {
  enrollInCourse,
  getEnrolledCourse,
  startEnroll,
} from "../controllers/enroll.controllers.js";
import validateUser from "../middlewares/userAuth.middlewares.js";

const router = Router();

// organizationId as query parameter
router.get(
  "/",
  fieldValidator(["organizationId"], true),
  validateUser("any"),
  getEnrolledCourse
);

router.post(
  "/",
  fieldValidator(["courses", "organizationId"]),
  validateUser("any"),
  enrollInCourse
);

router.post(
  "/startenroll",
  fieldValidator(["courses", "organizationId", "paymentMethod"]),
  validateUser("any"),
  startEnroll
);

export default router;
