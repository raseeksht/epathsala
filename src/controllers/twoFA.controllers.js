import asyncHandler from "express-async-handler";
import { userModel } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { decodeAuthHeaderToken, verifyOTP } from "../utils/utils.functions.js";

const getQR = asyncHandler(async (req, res) => {
    // generate random string
    const alnum = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // base32 alphabets
    let secret = "";
    for (let i = 0; i < 16; i++) {
        const pos = Math.floor(Math.random() * alnum.length)
        secret += alnum[pos]
    }
    const user = await userModel.findOne({ _id: req.user._id })
    const uri = encodeURIComponent(`otpauth://totp/E-PathSala: ${user.username}?secret=${secret}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${uri}`;
    const payload = {
        qr: qrUrl,
        secretToken: user.generateAccessToken({ totp: secret }),
        devMsg: "send secretToken back to server when turning on the 2fa or changing 2fa"
    }
    res.json(new ApiResponse(200, "scan qr", payload))
})


const set2fa = asyncHandler(async (req, res) => {
    const { otp, secretToken } = req.body;
    console.log(req.body)
    try {
        let user = await userModel.findOne({ _id: req.user._id })
        if (!user)
            throw new ApiError(400, "User does not exists")
        const { totp } = jwt.verify(secretToken, process.env.JWT_ACCESS_SECRET)
        if (verifyOTP(otp, totp)) {
            user.totpSecret = totp;
            user.use2FA = true
            user = await user.save();
            const payload = { _id: req.user._id, userType: user.userType, use2FA: true, is2FAVerified: true }

            res.json(new ApiResponse(200, "2FA Enabled!!", { token: user.generateAccessToken(payload) }))
        } else {
            throw new ApiError(400, "Invalid OTP")
        }
    } catch (err) {
        throw new ApiError(500, err?.message || "Unknown error while setting 2fa")
    }
})

const twoFAValidate = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    try {
        const decodedToken = decodeAuthHeaderToken(req)
        if (decodedToken.error)
            throw new ApiError(400, decodedToken.error)

        const user = await userModel.findOne({ _id: decodedToken._id })
        if (!user)
            throw new ApiError(400, "User Does not exists. When did you get that token?")
        if (!user.use2FA)
            throw new ApiError(400, "2fa not enabled on this account")
        if (verifyOTP(otp, user.totpSecret)) {
            console.log(decodedToken)
            const token = user.generateAccessToken({ _id: decodedToken._id, userType: decodedToken.userType, use2FA: true, is2FAVerified: true })
            // console.log(token)
            res.json(new ApiResponse(200, "OTP valid", { token }))
        }
        else {
            throw new ApiError(400, "Invalid or expired OTP")
        }


    } catch (error) {
        // throw new ApiError(400, error.message)
        throw new Error(error.message)
    }
})

const remove2fa = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    let user = await userModel.findOne({ _id: req.user._id });

    if (!user.use2FA) {
        throw new ApiError(400, "Already Disabled!!");
    }

    if (verifyOTP(String(otp), user.totpSecret)) {
        user.use2FA = false;
        user.save();
        res.json(new ApiResponse(200, "2fa removed", user))

    } else {
        throw new ApiError(401, "Invalid OTP")
    }

})

export {
    getQR, set2fa, twoFAValidate, remove2fa
}