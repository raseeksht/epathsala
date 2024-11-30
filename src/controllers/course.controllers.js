import asynchHandler from "express-async-handler";
// import { organizationModel } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";
import { courseModel } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { videoModel } from "../models/video.model.js";

const addCourse = asynchHandler(async (req, res) => {
  const { title, subTitle, price, description, thumbnail, level, category } =
    req.body;

  // check if course is already present for the user
  if (
    await courseModel.findOne({ title: title.trim(), creator: req.user._id })
  ) {
    throw new ApiResponse(400, "You already have course with that title");
  }

  try {
    const course = await courseModel.create({
      title: title.trim(),
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
    console.log(err);
    if (err.code == 11000) {
      throw new ApiError(400, `Duplicate '${Object.keys(err.keyValue)[0]}'`);
    }
    throw new ApiError(400, err.message);
  }
});

const editCourse = asynchHandler(async (req, res) => {
  const { title, subTitle, price, description, thumbnail, category, level } =
    req.body;
  const _id = req.params._id;
  const course = await courseModel.findOne({ _id }).populate([
    {
      path: "creator",
      select: "username email profilePic",
    },
    {
      path: "category",
    },
  ]);
  if (!course) {
    throw new ApiError(400, "that Course does not exists!" + _id);
  }

  if (
    !title &&
    subTitle &&
    !price &&
    !description &&
    !thumbnail &&
    !category &&
    !level
  ) {
    throw new ApiError(
      400,
      "Either one or many of (title , subTitle, price, desription, thumbnail,level or category) is required."
    );
  }
  if (!course.creator._id.equals(req.user._id)) {
    throw new ApiError(403, "You do not have required permission");
  }

  if (title) course.title = title;
  if (subTitle) course.subTitle = subTitle;
  if (level) course.level = level;
  if (category) course.category = category;
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
  const course = await courseModel
    .findOne({ _id })
    .populate([
      {
        path: "creator",
        select: "username email profilePic",
      },
      {
        path: "category",
        select: "name",
      },
    ])
    .lean();
  const videos = await videoModel.find({ course: _id }).lean();

  const combined = { ...course, lectures: [...videos] };

  course.lectures = videos;
  if (!course) {
    throw new ApiError(400, "404 course not found");
  }
  res.json(new ApiResponse(200, "course fetched", combined));
});

const getAllCourseByUser = asynchHandler(async (req, res) => {
  const userId = req.params.userId;
  let { title, level, isPaid, category, page, coursePerPage, latest } =
    req.query;

  const courses = await filterCourse({
    creator: userId,
    title,
    level,
    isPaid,
    category,
    page,
    coursePerPage,
    latest,
  });
  res.json(new ApiResponse(200, "all course by user", courses));
});

const calculateTotalPage = async (query, page, coursePerPage) => {
  const totalResult = await courseModel.countDocuments(query);
  const totalPage = Math.ceil(totalResult / coursePerPage);
  return { totalResult, totalPage, page, coursePerPage };
};

const filterCourse = async (
  { creator, title, isPaid, level, category, page, coursePerPage },
  ownCourse = false
) => {
  page = Number(page) || 1;
  if (page <= 0) page = 1;
  coursePerPage = Number(coursePerPage) || 2;
  const query = {
    $and: [
      creator ? { creator } : {},
      title ? { title: { $regex: title, $options: "i" } } : {},
      level ? { level: { $regex: level, $options: "i" } } : {},
      category ? { category } : {},
      isPaid === "false"
        ? { price: 0 }
        : isPaid === "true"
        ? { price: { $gt: 0 } }
        : {},
      ownCourse ? {} : { visible: true },
    ].filter((condition) => Object.keys(condition).length > 0),
  };

  const pageStats = await calculateTotalPage(query, page, coursePerPage);

  const filteredCourse = await courseModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * coursePerPage)
    .limit(coursePerPage)
    .populate([
      {
        path: "creator",
        select: "username email profile",
      },
      {
        path: "category",
        select: "name",
      },
    ]);

  return { filteredCourse, pageStats };
};

const courseFilterSearch = asynchHandler(async (req, res) => {
  let { title, isPaid, level, category, page, coursePerPage, latest } =
    req.query;

  try {
    const courses = await filterCourse({
      title,
      isPaid,
      level,
      category,
      page,
      coursePerPage,
      latest,
    });

    res.json(new ApiResponse(200, "course search filter result", courses));
  } catch (err) {
    console.log(err.message);
    throw new ApiError(400, "search failed " + err.message);
  }
});

const getMyCourse = asynchHandler(async (req, res) => {
  const { page, coursePerPage, name, isPaid, category, latest, title, level } =
    req.query;

  const myCourse = await filterCourse(
    {
      page,
      coursePerPage,
      name,
      isPaid,
      category,
      latest,
      title,
      level,
      creator: req.user._id,
    },
    true
  );

  res.json(new ApiResponse(200, "take your course", myCourse));
});

export {
  addCourse,
  editCourse,
  getCourse,
  deleteCourse,
  getAllCourseByUser,
  courseFilterSearch,
  getMyCourse,
};
