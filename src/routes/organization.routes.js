import { Router } from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import {
  createOrganization,
  editOrganization,
  getOrganization,
} from "../controllers/organization.controllers.js";

const router = Router();

// creator = orgamization
// one user one creator account

router.get("/:organizationId", getOrganization);
router.post("/", validateUser("teacher"), createOrganization);
router.put("/:organizationId", validateUser("teacher"), editOrganization);

export default router;
