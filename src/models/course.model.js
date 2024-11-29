import { Schema, model } from "mongoose";
import { videoModel } from "./video.model.js";
import fs from "fs";

const courseSchema = Schema({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
  },
  // courseId: {
  //   type: String,
  //   required: true,
  // },
  // creditHr: {
  //   type: String,
  //   required: true,
  // },
  description: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  price: {
    type: Number,
    required: true,
  },
});

courseSchema.pre("deleteOne", async function (next) {
  console.log("Deleting videos related to this course");
  // const courseId = this.getFilter();
  const videos = await videoModel.find({ course: courseId });

  videos.forEach(async (video) => {
    fs.rm(
      `uploads/videos/${video.uuid}`,
      { recursive: true, force: true },
      (err) => {
        if (err) {
          console.error(`Error while deleting :`, err);
        } else {
          console.log(`is deleted successfully.`);
        }
      }
    );
  });

  const vds = await videoModel.deleteMany({ course: courseId });
  console.log(videos);
  next();
});

// courseSchema.index({ name: 1, creator: 1 }, { unique: true });
// courseSchema.index({ courseId: 1, organization: 1 }, { unique: true });

const courseModel = model("Course", courseSchema);

export { courseModel };
