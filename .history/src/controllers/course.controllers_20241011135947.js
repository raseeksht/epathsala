import asynchHandler from "express-async-handler";
import { organizationModel } from "../models/organization.model.js";
import { ApiError } from "../utils/ApiError.js";
import { courseModel } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addCourse = asynchHandler(async (req, res) => {
    const { name, courseId, creditHr, organization } = req.body;

    // check if organization exists
    const doesExists = await organizationModel.findOne({ _id: organization });
    if (!doesExists) {
        throw new ApiError(400, "Organization does not exists!!");
    }

    // const orgCourses = await courseModel.find({ organization })
    try {

        const course = await courseModel.create({ name, courseId, creditHr, organization })

        if (course) {
            res.status(201).json(new ApiResponse(201, "Course Successfully added!!"))
        } else {
            throw new ApiError(500, "failed to add the course")
        }
    } catch (err) {
        if (err.code == 11000) {
            throw new ApiError(400, `Duplicate '${Object.keys(err.keyValue)[0]}'`)
        }
        throw new ApiError(400, err.message)
    }
})

const editCourse = asynchHandler(async (req, res) => {
    const { name, courseId, creditHr, organization } = req.body;
    const { _id } = req.params._id;
    const org = await courseModel.findOne({ _id });
    if (!org) {
        throw new ApiError(400, "that Course does not exists!");
    }

    if (!organization) {
        throw new ApiError(400, "organization field is required");

    }

    if (!name && !courseId && !creditHr) {
        throw new ApiError(400, "Either of (name, courseId or creditHr) is required.")
    }


})

export { addCourse };