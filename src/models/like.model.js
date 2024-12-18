import mongoose from "mongoose";

const likeSchema = mongoose.Schema(
  {
    liked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    like_on: {
      type: String,
      enum: ["Post", "Video"],
      required: true,
    },
    like_on_ref: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "like_on",
      required: true,
    },
  },
  { timestamps: true }
);

const likeModel = mongoose.model("like", likeSchema);

export default likeModel;
