import { Router } from "express";

import validateUser from "../middlewares/userAuth.middlewares.js";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import {
  addRating,
  getUserRatings,
} from "../controllers/rating.controllers.js";

const router = Router();

// add or update rating
router.post(
  "/",
  validateUser("any"),
  fieldValidator(["star", "course"]),
  addRating
);

router.get("/myratings", validateUser(), getUserRatings);

export default router;
