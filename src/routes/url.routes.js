import { Router } from 'express';
// import validateUser from '../middlewares/userAuth.middleware.js';
import { getPresignedUrl } from '../controllers/urls.controllers.js';
const router = Router();

router.get("/", getPresignedUrl)

export default router;