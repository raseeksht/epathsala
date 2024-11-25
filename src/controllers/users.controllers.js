import asyncHandler from "express-async-handler";
import { userModel } from "../models/users.model.js";
import validator from "validator";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { logger } from "../app.js";
import { decodeAuthHeaderToken, verifyOTP } from "../utils/utils.functions.js";

const createUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password, userType } = req.body;
  if (
    (await userModel.countDocuments({ $or: [{ username }, { email }] })) >= 1
  ) {
    // logger.error("Duplicate user registration")
    throw new ApiError(400, "User already registered");
  }
  const user = await userModel.create({
    fullname,
    username,
    email,
    password,
    userType,
  });

  const resUser = await userModel
    .findOne({ _id: user._id })
    .select("-password");
  res.json(new ApiResponse(201, "User created", resUser));
});

const loginUser = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password, otp } = req.body;
  const query = validator.isEmail(usernameOrEmail)
    ? { email: usernameOrEmail.toLowerCase() }
    : { username: usernameOrEmail.toLowerCase() };
  const user = await userModel.findOne(query);
  if (user && (await user.matchPassword(password))) {
    const reqFields = {
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profilePic: user.profilePic,
    };
    const payload = {
      _id: user._id,
      userType: user.userType,
    };
    let message = "Login Success";

    if (user.use2FA && otp) {
      if (!verifyOTP(String(otp), user.totpSecret)) {
        throw new ApiError(400, "Invalid OTP");
      }
      payload.use2FA = true;
      payload.is2FAVefified = true;
    }
    if (user.use2FA && !otp) {
      throw new ApiError(401, "2FA enabled! otp required to login");
    }

    const token = await user.generateAccessToken(payload);
    console.log(token);
    res.json(new ApiResponse(200, message, { ...reqFields, token }));
  } else {
    throw new ApiError(403, "email or password error");
  }
});

const editDetails = asyncHandler(async (req, res) => {
  // only username number and address are allowed to change
  const { fullname, username, number, address, profilePic } = req.body;
  if (!(username || number || address || profilePic)) {
    throw new ApiError(
      400,
      "any of username, number,address,fullname or profilePic is required. All missing!"
    );
  }
  const user = await userModel
    .findOne({ _id: req.user._id })
    .select("-password");
  if (username) user.username = username.toLowerCase();
  if (fullname) user.fullname = fullname;
  if (number) user.number = number;
  if (address) user.address = address;
  if (profilePic) user.profilePic = profilePic;
  try {
    const edited = await user.save();
    res.json(new ApiResponse(200, "Edited Successfully", edited));
  } catch (err) {
    throw new ApiError(500, err.message);
  }
});

export { createUser, loginUser, editDetails };
