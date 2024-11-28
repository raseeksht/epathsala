import { Router } from "express";
import {
  addCategory,
  editCategory,
  getAllCategories,
  searchCategory,
} from "../controllers/category.controllers.js";

const router = Router();

router.get("/", getAllCategories);
router.get("/search", searchCategory);
router.post("/", addCategory);
router.put("/:categoryId", editCategory);

export default router;
