import { model, Schema } from "mongoose";

const videoSchema = Schema({
  title: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  manifestFile: {
    type: String,
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  uploader: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  thumbnail: {
    type: String,
  },
  likes: {
    type: Number,
    default: 0,
  },
});

const videoModel = model("Video", videoSchema);

export { videoModel };
