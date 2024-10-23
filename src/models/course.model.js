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
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: "Organization"
    }
})

courseSchema.index({ name: 1, organization: 1 }, { unique: true });
courseSchema.index({ courseId: 1, organization: 1 }, { unique: true });

const courseModel = model("Course", courseSchema)

export { courseModel };