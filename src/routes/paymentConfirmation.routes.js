import { Router } from "express";
import {
  esewaSuccess,
  esewaFailure,
  khaltiSuccess,
  khaltiFailure,
} from "../controllers/paymentConfirmation.controllers.js";

const router = Router();

router.get("/esewasuccess", esewaSuccess);

router.get("/esewafailure", esewaFailure);

router.get("/khaltisuccess", khaltiSuccess);
router.get("/khaltifailure", khaltiFailure);

export default router;
