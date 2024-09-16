import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TOTP } from 'totp-generator'

const generatePresignedUrl = (imgType = "profile") => {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const options = {
        folder: `project/${imgType == "profile" ? "profile" : "videoThumb"}`,
        timestamp: timestamp,
        upload_preset: "ml_default",
    }

    const signature = cloudinary.utils.api_sign_request(options, process.env.CLOUDINARY_API_SECRET);

    return {
        ...options,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        postUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUDNAME}/auto/upload`
    }
}




const generateHmacSignature = (message) => {
    return crypto.createHmac('sha256', process.env.ESEWA_SECRET)
        .update(message)
        .digest('base64')

}

const verifyOTP = (userOTP, secret) => {
    console.log(userOTP, secret)
    const currentTimestamp = Date.now()
    const validCodes = [];

    for (let i = -1; i <= 1; i++) {
        const timestamp = currentTimestamp + (i * 30000)
        const { otp } = TOTP.generate(secret, { timestamp })
        validCodes.push(otp)
    }
    const ans = Boolean(validCodes.includes(userOTP))
    console.log(ans)
    return ans
}

const decodeAuthHeaderToken = (req) => {
    const authToken = req.headers?.authorization
    if (!(authToken && authToken.startsWith("Bearer "))) {
        return { error: "Bearer Token Required" };
    }
    const token = authToken.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    if (decoded) {
        return decoded
    } else {
        return { error: "Token Invalid or expired" }
    }
}

export { generatePresignedUrl, generateHmacSignature, verifyOTP, decodeAuthHeaderToken }