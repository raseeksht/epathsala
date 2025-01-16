import asynchHandler from "express-async-handler";
// import { organizationModel } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";
import { courseModel } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { videoModel } from "../models/video.model.js";
import categoryModel from "../models/category.model.js";
import { calculateCosineSimilarity, getCombinedVector, normalizeValue, textToVector } from '../utils/utils.functions.js';
import { userCourseEnrollModel } from '../models/userCourseEnroll.model.js';
import mongoose from "mongoose";

function filterByRating(ratingParam) {
  const availableRatingParam = ["high", "low", "1", "2", "3", "4", "5"];
  if (!availableRatingParam.includes(ratingParam)) {
    return false;
  }
  if (ratingParam === "high") {
    return {
      sort: { rating: -1 },
    };
  } else if (ratingParam === "low") {
    return {
      sort: { rating: 1 },
    };
  } else {
    return {
      rating: { $gte: parseInt(ratingParam) },
    };
  }
}

const filterCourse = async (
  { creator, title, isPaid, level, category, page, coursePerPage, rating },
  ownCourse = false
) => {
  const getRatingSort = (rating) => {
    return rating == "high" ? -1 : rating == "low" ? 1 : "";
  };

  page = Number(page) || 1;
  if (page <= 0) page = 1;
  let filteredRating = filterByRating(rating);

  let numberedRating;
  if (parseInt(rating) >= 1 && parseInt(rating) <= 5) {
    numberedRating = parseInt(rating);
  }

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
      numberedRating ? filteredRating : {},
    ].filter((condition) => Object.keys(condition).length > 0),
  };

  const sortFilter = {
    averageRating: getRatingSort(rating),
    createdAt: -1,
  };

  Object.keys(sortFilter).map((key) => {
    if (sortFilter[key] == "") {
      delete sortFilter[key];
    }
  });

  const pageStats = await calculateTotalPage(query, page, coursePerPage);

  const filteredCourse = await courseModel
    .find(query,{textVectors:0})
    .sort(sortFilter)
    .skip((page - 1) * coursePerPage)
    .limit(coursePerPage)
    .populate([
      {
        path: "creator",
        select: "username fullname email profilePic",
      },
      {
        path: "category",
        select: "name",
      },
    ]).lean();

  const enrichedCourses = await Promise.all(
    filteredCourse.map(async (course) => {
      const noOfVideos = await videoModel.countDocuments({
        course: course._id,
      });
      return {
        ...course, // to plain js object
        noOfVideos,
      };
    })
  );

  return { filteredCourse: enrichedCourses, pageStats };
};

const addCourse = asynchHandler(async (req, res) => {
  const { title, subTitle, price, description, thumbnail, level, category } =
    req.body;

  // check if category exits
  const categoryExists = await categoryModel.findOne({ _id: category });
  // check if course is already present for the user
  if (!categoryExists) {
    throw new ApiError(404, "That category does not exists");
  }
  if (
    await courseModel.findOne({ title: title.trim(), creator: req.user._id })
  ) {
    throw new ApiError(400, "You already have course with that title");
  }

  try {
    const precomputedVector = getCombinedVector(title, subTitle, description);
    const course = await courseModel.create({
      title: title.trim(),
      subTitle,
      level,
      category,
      price,
      description,
      thumbnail,
      creator: req.user._id,
      textVectors: precomputedVector
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

  if (title || subTitle || description) {
    course.textVectors = getCombinedVector(
      course.title,
      course.subTitle,
      course.description
    );
  }
  
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
  if (!course.creator._id.equals(req.user._id)) {
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

  // const a = await userCourseEnrollModel.find({course:_id,user:req.user?._id})
  // return res.json({a})

  const course = await courseModel
    .findOne({ _id },{textVectors:0})
    .populate([
      {
        path: "creator",
        select: "fullname username email profilePic",
      },
      {
        path: "category",
        select: "name",
      }
    ])
    .lean();
    if (!course) throw new ApiError(404,"Course does not exists");

    // check if the requestor is the creator
    const isCreator = course.creator._id.equals(req.user?._id)
    const isEnrolled = await userCourseEnrollModel.findOne({course :_id, user: req.user?._id})

    let videoDetails = {manifestFile: 0,uuid:0}; // for unauth users
    if (isCreator || isEnrolled){
      // either creator or enrolled user
      videoDetails = {}
    }

    const videos = await videoModel.find({ course: _id },videoDetails).lean();

    const combined = { ...course,bought:!!isEnrolled, lectures: [...videos] };

    course.lectures = videos;
  
  res.json(new ApiResponse(200, "course fetched", combined));
});

const getAllCourseByUser = asynchHandler(async (req, res) => {
  const userId = req.params.userId;
  let { title, level, isPaid, category, page, coursePerPage, latest, rating } =
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
    rating,
  });
  res.json(new ApiResponse(200, "all course by user", courses));
});

const calculateTotalPage = async (query, page, coursePerPage) => {
  const totalResult = await courseModel.countDocuments(query);
  const totalPage = Math.ceil(totalResult / coursePerPage);
  return { totalResult, totalPage, page, coursePerPage };
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
    
    // for logged in user, show bought: true if the courses is already purchased by the user
    if (req.user?._id){
      let boughtCourses = await userCourseEnrollModel.find({user:req.user._id},{course:1}).lean();
      boughtCourses = boughtCourses.map(bc=>bc.course.toString())

      if (boughtCourses.length > 0){
        const checkedCourse = courses.filteredCourse.map(course=>{
          if (boughtCourses.includes(course._id.toString())){
            return {...course, bought:true}
          }
          return course
        })
        courses.filteredCourse = checkedCourse
      }
    }

    res.json(new ApiResponse(200, "course search filter result", courses));
  } catch (err) {
    throw new ApiError(400, "search failed " + err.message);
  }
});

const getMyCourse = asynchHandler(async (req, res) => {
  const {
    page,
    coursePerPage,
    name,
    isPaid,
    category,
    latest,
    title,
    level,
    rating,
  } = req.query;

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
      rating,
    },
    true
  );

  res.json(new ApiResponse(200, "take your course", myCourse));
});

const getSuggestedCourse = asynchHandler(async (req, res) => {
  const userCourses = await userCourseEnrollModel.find({ user: req.user._id }).sort({createdAt:1}).populate("course");

  if (userCourses.length == 0){
    // if user has 0 courses enrolled just suggest the highest rated course.
    const myCourse = await filterCourse({rating:"high"});
    return res.json(new ApiResponse(200,"Suggested Course",myCourse));
  }else{
    const latestCourse = userCourses[0];
    const courses = await courseModel.find({_id:{$ne:latestCourse.course}},{textVectors:0});
    // const courses = await courseModel.find().where('_id').ne(latestCourse.course);

    const allPrices = courses.map(obj => obj.price).concat(latestCourse.course.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    const similarities = courses.map(course=> {
      const text1 = latestCourse.course.title
      const text2 = course.title
      const [v1,v2] = textToVector(text1,text2)

      const textSimilarity = calculateCosineSimilarity(v1,v2);

      const categorySimilarity = latestCourse.course.category == course.category ? 1 : 0;
      const levelSimilarity = latestCourse.course.level === course.level ? 1 : 0;

      const normPriceOfLatestCourse = normalizeValue(latestCourse.course.price, minPrice, maxPrice);
      const normPriceOfCourse = normalizeValue(course.price, minPrice, maxPrice);
      const priceDifference = 1 - Math.abs(normPriceOfLatestCourse - normPriceOfCourse);

      const weights = {
        text: 0.5,
        level: 0.1,
        category: 0.2,
        price: 0.2,
      };

      const overallSimilarity =
        textSimilarity * weights.text +
        levelSimilarity * weights.level +
        categorySimilarity * weights.category +
        priceDifference * weights.price;
      
        return {
          ...course._doc,
          similarity: overallSimilarity,
        };

    })
    


    res.json(new ApiResponse(200,"okay",similarities))

  }
});

export {
  addCourse,
  editCourse,
  getCourse,
  deleteCourse,
  getAllCourseByUser,
  courseFilterSearch,
  getMyCourse,
  getSuggestedCourse
};
