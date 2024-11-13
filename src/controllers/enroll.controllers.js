import asyncHandler from "express-async-handler";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userCourseEnrollModel } from "../models/userCourseEnroll.model.js";
import { courseModel } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import { txnModel } from "../models/transaction.model.js";
import { generateHmacSignature } from "../utils/utils.functions.js";
import axios from "axios";

const getEnrolledCourse = asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId;

  const enrolledCourses = await userCourseEnrollModel.find({
    organization: organizationId,
    user: req.user._id,
  });

  return res.json(new ApiResponse(200, "okay", enrolledCourses));
});

const getSelectedCourse = async (courses, organizationId) => {
  if (!Array.isArray(courses)) {
    throw new ApiError(400, "courses field is expected to be of type Array");
  }
  if (courses.length == 0) {
    throw new ApiError(400, "Enrolling in 0 courses? are you sure?");
  }
  const selectedCourses = await courseModel.find({
    _id: { $in: courses },
    organization: organizationId,
  });

  if (selectedCourses.length != courses.length) {
    throw new ApiError(
      400,
      "one or more of course does not exists or doesn't belong to the given organization"
    );
  }

  return selectedCourses;
};

const enrollInCourse = asyncHandler(async (req, res) => {
  const { courses, organizationId } = req.body;
  if (!Array.isArray(courses)) {
    throw new ApiError(400, "courses field is expected to be of type Array");
  }
  const selectedCourses = await courseModel.find({
    _id: { $in: courses },
    organization: organizationId,
  });

  if (selectedCourses.length != courses.length) {
    throw new ApiError(
      400,
      "one or more of course does not exists or doesn't belong to the given organization"
    );
  }

  res.json(new ApiResponse(200, "take this", selectedCourses));
});

const startEnroll = asyncHandler(async (req, res) => {
  const { courses, organizationId, paymentMethod } = req.body;
  const selectedCourses = await getSelectedCourse(courses, organizationId);

  const totalPrice = selectedCourses.reduce((total, course) => {
    return total + course.pricePerMonth;
  }, 0);

  const txUuid = uuidv4();

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
      success_url: process.env.BACKEND_URL + "/api/payment/esewasuccess",
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

export { getEnrolledCourse, enrollInCourse, startEnroll };
