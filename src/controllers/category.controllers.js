import asyncHandler from "express-async-handler";
import categoryModel from "../models/category.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const addCategory = asyncHandler(async (req, res) => {
  let { name } = req.body;

  name = name[0].toUpperCase() + name.slice(1).toLowerCase();

  try {
    const category = await categoryModel.create({ name });
    res.status(201).json(new ApiResponse(201, "New Category Added", category));
  } catch (err) {
    if (err.code == 11000) {
      throw new ApiError(400,"Duplicate category name");
    }
    throw new ApiError(500, err.getMessage());
  }
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryModel.find();
  res.json(new ApiResponse(200, "all available categories", categories));
});

const editCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId;
  let { name } = req.body;

  try {
    const category = await categoryModel.findOne({ _id: categoryId });
    if (!category) {
      throw new ApiError(404, "catgory not found");
    }
    category.name = name[0].toUpperCase() + name.slice(1).toLowerCase();
    await category.save();
    res.json(new ApiResponse(200, "Edidted", category));
  } catch (err) {
    console.log(err);
    throw new ApiError(400, "Failed to edit category name");
  }
});

const searchCategory = asyncHandler(async (req, res) => {
  const categoryName = req.query.name;
  try {
    const categories = await categoryModel.find({
      name: { $regex: categoryName, $options: "i" },
    });
    res.json(new ApiResponse(200, "search result", categories));
  } catch (err) {
    throw new ApiError(400, err.getMessage());
  }
});

export { addCategory, getAllCategories, editCategory, searchCategory };
