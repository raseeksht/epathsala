import { model, Schema } from "mongoose";

const videoSchema = Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  course_ref: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  uploader: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  likes: {
    type: Number,
    default: 0,
  },
});

const videoModel = model("Video", videoSchema);

export { videoModel };
