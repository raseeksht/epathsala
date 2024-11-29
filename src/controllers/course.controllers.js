import asynchHandler from "express-async-handler";
// import { organizationModel } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";
import { courseModel } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addCourse = asynchHandler(async (req, res) => {
  const { title, subTitle, price, description, thumbnail, level, category } =
    req.body;

  // check if course is already present for the user
  if (await courseModel.findOne({ title, creator: req.user._id })) {
    throw new ApiResponse(400, "You already have course with that name");
  }

  // check if organization exists
  // const org = await organizationModel.findOne({ _id: organization });
  // if (!org) {
  //   throw new ApiError(400, "Organization does not exists!!");
  // }

  // if (!org.admin.equals(req.user._id)) {
  //   throw new ApiError(403, "You are not the admin of this organization");
  // }

  // const orgCourses = await courseModel.find({ organization })
  console.log(req.body);
  try {
    const course = await courseModel.create({
      title,
      subTitle,
      level,
      category,
      price,
      description,
      thumbnail,
      creator: req.user._id,
    });

    if (course) {
      res
        .status(201)
        .json(new ApiResponse(201, "Course Successfully added!!", course));
    } else {
      throw new ApiError(500, "failed to add the course");
    }
  } catch (err) {
    if (err.code == 11000) {
      throw new ApiError(400, `Duplicate '${Object.keys(err.keyValue)[0]}'`);
    }
    throw new ApiError(400, err.message);
  }
});

const editCourse = asynchHandler(async (req, res) => {
  const { name, price, description, thumbnail } = req.body;
  const _id = req.params._id;
  const course = await courseModel.findOne({ _id }).populate({
    path: "creator",
    select: "username email profilePic",
  });
  if (!course) {
    throw new ApiError(400, "that Course does not exists!" + _id);
  }

  if (!name && !price && !description && !thumbnail) {
    throw new ApiError(
      400,
      "Either one or many of (name, price, desription, thumbnail) is required."
    );
  }
  if (!course.creator._id.equals(req.user._id)) {
    throw new ApiError(403, "You do not have required permission");
  }

  if (name) course.name = name;
  if (price) course.price = price;
  if (description) course.description = description;
  if (thumbnail) course.thumbnail = thumbnail;

  await course.save();

  res.json(new ApiResponse(200, "Edit Successfully", course));
});

const deleteCourse = asynchHandler(async (req, res) => {
  const _id = req.params._id;
  const course = await courseModel.findOne({ _id }).populate({
    path: "creator",
    select: "username email profilePic",
  });
  if (!course) {
    throw new ApiError(404, "Course does not exits.");
  }
  if (!course.creator.equals(req.user._id)) {
    throw new ApiError(403, "You do not have required permission");
  }

  const del = await courseModel.deleteOne({ _id });
  if (del.deletedCount == 1) {
    res.json(new ApiResponse(204, "deleted successfully", course));
  } else {
    throw new ApiError(400, `Failed while deleting course: ${_id}`);
  }
});

const getCourse = asynchHandler(async (req, res) => {
  const _id = req.params._id;
  const course = await courseModel.findOne({ _id }).populate({
    path: "creator",
    select: "username email profilePic",
  });
  if (!course) {
    throw new ApiError(400, "404 course not found");
  }
  res.json(new ApiResponse(200, "course fetched", course));
});

const getAllCourseByUser = asynchHandler(async (req, res) => {
  const userId = req.params.userId;

  const courses = await courseModel.find({ creator: userId });
  res.json(new ApiResponse(200, "all course by user", courses));
});

const courseFilterSearch = asynchHandler(async (req, res) => {
  let { title, isPaid, level, visible } = req.query;

  try {
    const query = {
      $and: [
        title ? { title: { $regex: title, $options: "i" } } : {},
        level ? { level: { $regex: level, $options: "i" } } : {},
        isPaid === "false"
          ? { price: 0 }
          : isPaid === "true"
          ? { price: { $gt: 0 } }
          : {},
        { visible: true },
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    console.log(query);

    const courses = await courseModel.find(query);

    console.log(courses);

    res.json(new ApiResponse(200, "course search filter result", courses));
  } catch (err) {
    console.log(err.message);
    throw new ApiError(400, "search failed " + err.message);
  }
});

export {
  addCourse,
  editCourse,
  getCourse,
  deleteCourse,
  getAllCourseByUser,
  courseFilterSearch,
};
