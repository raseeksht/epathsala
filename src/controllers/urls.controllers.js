import asyncHandler from "express-async-handler";
import { generatePresignedUrl } from "../utils/utils.functions.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getPresignedUrl = asyncHandler(async (req, res) => {
    const { imageFor } = req.query
    const options = generatePresignedUrl(imageFor);
    res.json(new ApiResponse(200, "send formData post req to postUrl with given data + file", options))

})

export { getPresignedUrl };