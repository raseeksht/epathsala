import { Router } from "express";
import validateUser from "../middlewares/userAuth.middlewares.js";
import { getQR, remove2fa, set2fa, twoFAValidate } from "../controllers/twoFA.controllers.js";

const router = Router();


router.get("/getqr", getQR);

router.post("/set2fa", set2fa)

router.post("/validate", twoFAValidate)

router.post("/remove2fa", remove2fa)

router.post("verify", validateUser)

export default router;