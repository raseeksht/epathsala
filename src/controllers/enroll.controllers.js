import asyncHandler from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userCourseEnrollModel } from "../models/userCourseEnroll.model.js";
import { courseModel } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import { txnModel } from "../models/transaction.model.js";
import { generateHmacSignature } from "../utils/utils.functions.js";
import axios from "axios";

const checkCourseEnrollment = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;

  // const course = await courseModel.findOne({ _id: courseId });
  const userCourse = await userCourseEnrollModel.findOne({ course: courseId });

  if (!userCourse) throw new ApiError(404, "Not Enrolled");

  if (userCourse.totalFee == 0) {
    // free course, so no need to verify further
    return res.json(new ApiResponse(200, "Payment Verified"));
  }

  const txn = await txnModel.findOne({ transactionUuid: userCourse.txnId });

  if (!txn) throw new ApiError(404, "Transaction Incomplete");

  if (txn.user.equals(req.user._id) && txn.status == "COMPLETE") {
    res.json(new ApiResponse(200, "Payment Verified"));
  } else {
    throw new ApiError(403, "Unverified");
  }
});

const getEnrolledCourse = asyncHandler(async (req, res) => {
  const enrolledCourses = await userCourseEnrollModel.find({
    // organization: organizationId,
    user: req.user._id,
  }).populate([{
    path:"course"
  }]);

  return res.json(new ApiResponse(200, `all course enrolled`, enrolledCourses));
});

const getSelectedCourse = async (courses) => {
  if (!Array.isArray(courses)) {
    throw new ApiError(400, "courses field is expected to be of type Array");
  }
  if (courses.length == 0) {
    throw new ApiError(400, "Enrolling in 0 courses? are you sure?");
  }
  const selectedCourses = await courseModel.find({
    _id: { $in: courses },
  });

  if (selectedCourses.length != courses.length) {
    throw new ApiError(400, "one or more of course does not exists");
  }

  return selectedCourses;
};

const startEnroll = asyncHandler(async (req, res) => {
  const { courses, paymentMethod } = req.body;
  const selectedCourses = await getSelectedCourse(courses);

  const txUuid = uuidv4();

  // check if already enrolled;
  const enrolled = await userCourseEnrollModel
    .find({ course: { $in: courses }, txnStatus: "COMPLETE" })
    .populate([
      {
        path: "course",
        select: "title",
      },
      {
        path: "creator",
        select: "fullname",
      },
    ]);
  const coursesName = enrolled
    .map((course) => {
      return course.course.title;
    })
    .join(", ");
  if (enrolled.length > 0) {
    throw new ApiError(400, `Already Enrolled in ${coursesName}`);
  }

  const userCourseBulkWrite = selectedCourses.map((course) => {
    const userCourse = {
      user: req.user._id,
      course: course._id,
      creator: course.creator,
      enrollDate: new Date(),
      totalFee: course.price,
      txnId: txUuid,
    };

    return {
      updateOne: {
        filter: { course: course._id, user: req.user._id }, // Match on course and txnId
        update: { $set: userCourse }, // Update the document if it exists
        upsert: true, // Create a new document if it doesn't exist
      },
    };
  });

  const totalPrice = selectedCourses.reduce((total, course) => {
    return total + course.price;
  }, 0);

  // console.log(userCourseBulkWrite);
  const write = await userCourseEnrollModel.bulkWrite(userCourseBulkWrite);

  console.log(write);

  // add to userCourse Enroll with all data + status pending
  // add status enrolled after payment is verified

  // const

  if (paymentMethod == "Esewa") {
    const esewaForm = {
      amount: totalPrice,
      tax_amount: 0,
      total_amount: totalPrice,
      transaction_uuid: txUuid,
      product_code: "EPAYTEST",
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: process.env.BACKEND_URL + `/api/payment/esewasuccess`,
      failure_url: process.env.BACKEND_URL + "/api/payment/esewafailure",
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    const message = `total_amount=${totalPrice},transaction_uuid=${esewaForm.transaction_uuid},product_code=${esewaForm.product_code}`;
    esewaForm.signature = generateHmacSignature(message);
    return res.json(new ApiResponse(200, "esewa payment form", esewaForm));
  } else if (paymentMethod == "Khalti") {
    const khaltiForm = {
      return_url: `${process.env.BACKEND_URL}/api/payment/khaltisuccess`,
      website_url: process.env.BACKEND_URL,
      amount: totalPrice * 100,
      purchase_order_id: txUuid,
      purchase_order_name: "test",
      merchant_username: "merchant_name",
      merchant_extra: "merchant_extra",
    };
    const config = {
      headers: {
        Authorization: `key ${process.env.KHALTI_LIVE_SECRET}`,
        "Content-Type": "application/json",
      },
    };
    try {
      const resp = await axios.post(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        khaltiForm,
        config
      );
      return res.json(new ApiResponse(201, "khali order created", resp.data));
    } catch (err) {
      console.log(err.response.data);
      throw new ApiError(400, err.response.data.detail);
    }
  }

  res.json(new ApiResponse(200, "take this", selectedCourses));
});

export { getEnrolledCourse, startEnroll, checkCourseEnrollment };
