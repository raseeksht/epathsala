import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { generateHmacSignature } from "../utils/utils.functions.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { txnModel } from "../models/transaction.model.js";
import axios from "axios";
import { userCourseEnrollModel } from "../models/userCourseEnroll.model.js";
// import { orderModel } from "../models/orders.model.js";

const updateOrder = async (txUuid, status) => {
  const set = await userCourseEnrollModel.updateMany(
    { txnId: txUuid },
    {
      $set: { txnStatus: status },
    }
  );
};

const esewaSuccess = asyncHandler(async (req, res) => {
  const data = req.query.data;
  if (!data) {
    throw new ApiError(400, "not redirected from esewa");
  }
  try {
    const d64decoded = JSON.parse(atob(data));


    let message = d64decoded.signed_field_names
      .split(",")
      .map((field) => {
        return (field == "total_amount") ? `${field}=${d64decoded[field].replace(",","")}` : `${field}=${d64decoded[field]}`
        }).join(",")
    const calcSignature = generateHmacSignature(message);

    // compare computed signature with the singature sent by esewa signed by our key
    if (calcSignature != d64decoded.signature) {
      throw new ApiError(
        400,
        "Invalid Signature. Couldn't validate transaction"
      );
    }

    const userCourse = await userCourseEnrollModel.findOne({
      txnId: d64decoded.transaction_uuid,
    });


    const txn = await txnModel.create({
      transactionCode: d64decoded.transaction_code,
      status: d64decoded.status,
      totalAmount: d64decoded.total_amount.replace(",",""),
      transactionUuid: d64decoded.transaction_uuid,
      productCode: d64decoded.product_code,
      signature: d64decoded.signature,
      user: userCourse.user,
    });

    updateOrder(d64decoded.transaction_uuid, d64decoded.status);

    res.redirect(
      process.env.FRONTEND_URL +
        `/success/?success=1?productCode=${d64decoded.product_code}`
    );
  } catch (error) {
    throw new ApiError(400, error.message);
  }
});

const esewaFailure = asyncHandler(async (req, res) => {
  res.redirect(process.env.FRONTEND_URL + "/failure/?success=0");
});

const khaltiSuccess = asyncHandler(async (req, res) => {
  const {
    pidx,
    txnId,
    amount,
    total_amount,
    mobile,
    status,
    tidx,
    purchase_order_id,
    purchase_order_name,
    transaction_id,
  } = req.query;
  const confirmationUrl = process.env.KHALTI_CONFIRMATION_URL;
  const config = {
    headers: {
      Authorization: `key ${process.env.KHALTI_LIVE_SECRET}`,
    },
  };
  try {
    const resp = await axios.post(confirmationUrl, { pidx }, config);
    const data = resp.data;
    const txn = await txnModel.create({
      transactionCode: data.pidx,
      status: data.status,
      totalAmount: data.total_amount / 100,
      transactionUuid: purchase_order_id,
      fee: data.fee / 100,
    });
    updateOrder(purchase_order_id, txn._id);

    if (resp.data.status == "Completed") {
      return res.redirect(process.env.FRONTEND_URL + "?payment=success");
    } else {
      return res.redirect(
        process.env.FRONTEND_URL + "?payment=" + resp.data.status
      );
    }
  } catch (err) {
    throw new ApiError(400, err.message || "payment failed");
  }
});

const khaltiFailure = asyncHandler(async (req, res) => {
  return res.redirect(
    process.env.FRONTEND_URL +
      "/path/to/failure/?success=0?payment=" +
      req.query.status
  );
});

export { esewaSuccess, esewaFailure, khaltiSuccess, khaltiFailure };
