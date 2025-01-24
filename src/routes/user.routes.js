import { Router } from "express";
import { fieldValidator } from "../middlewares/fieldValidator.middlewares.js";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  createUser,
  editDetails,
  loginUser,
  myDetails,
} from "../controllers/users.controllers.js";
import twoFARoutes from "./twofa.routes.js";

const router = Router();

router.get("/",validateUser('any'), myDetails);

router.post(
  "/register",
  fieldValidator(["fullname", "username", "email", "password", "userType"]),
  createUser
);
router.post(
  "/login",
  fieldValidator(["usernameOrEmail", "password"]),
  loginUser
);
router.put("/editdetails", validateUser("any"), editDetails);

router.use("/2fa", validateUser("any"), twoFARoutes);

export default router;
