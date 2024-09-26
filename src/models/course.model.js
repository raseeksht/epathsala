import { Schema, model } from "mongoose";

const courseSchema = Schema({
    name: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    creditHr: {
        type: String,
        required: true
    }
})

const courseModel = model("Course", courseSchema)

export { courseModel };