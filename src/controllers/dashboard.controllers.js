import asyncHandler from "express-async-handler";
import { courseModel } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userCourseEnrollModel } from "../models/userCourseEnroll.model.js";
import { userModel } from "../models/users.model.js";

const teacherDashboard = asyncHandler(async (req, res) => {
  const teacherCourse = await courseModel.find({ creator: req.user._id });

  const studentCount = await userCourseEnrollModel.countDocuments({
    creator: req.user._id,
  });

  const teacherCoursePaid = teacherCourse.filter((course) => course.price > 0);
  const teacherCourseFree = teacherCourse.filter((course) => course.price == 0);

  //   money
  const userwithmoney = await userCourseEnrollModel.find({
    creator: req.user._id,
  });
  const totalMoneyEarned = userwithmoney.reduce((total, userEnroll) => {
    return total + userEnroll.totalFee;
  }, 0);

  const payload = {
    paid: teacherCoursePaid,
    free: teacherCourseFree,
    totalStudentCount: studentCount,
    money: totalMoneyEarned,
  };
  res.json(new ApiResponse(200, "teach dashboard", payload));
});

const studentDashboard = asyncHandler(async (req, res) => {
  const course = await userCourseEnrollModel.find({
    user: req.user._id,
    txnStatus: "COMPLETE",
  });

  const payload = {
    // paid:teacherCoursePaid,
    // free:teacherCourseFree
    course,
  };
  res.json(new ApiResponse(200, "stud dashboard", payload));
});

export { teacherDashboard, studentDashboard };
