import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import { videoQueue } from "../utils/worker.js";
import path from "path";
import { fileURLToPath } from "url";
import { videoModel } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { courseModel } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import likeModel from "../models/like.model.js";
import mongoose from "mongoose";

const handleVideoUpload = asyncHandler(async (req, res) => {
  const { title, description, course } = req.body;
  const vId = uuidv4();
  const videoPath = req.file?.path;
  if (!videoPath) {
    throw new ApiError(400, "Video Missing");
  }
  const selectedCourse = await courseModel.findOne({ _id: course });
  if (!selectedCourse) {
    throw new ApiError(404, "Course Does not Exists");
  }

  if (!selectedCourse.creator.equals(req.user._id)) {
    throw new ApiError(403, "Cannot upload to this course.");
  }

  const outputPath = `uploads/videos/${vId}`;
  const hlsPath = `${outputPath}/master.m3u8`;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const job = await videoQueue.add({
    videoPath: path.join(__dirname, "..", "..", videoPath),
    outputPath: outputPath,
  });

  const videoUrl = `${process.env.BACKEND_URL}/${outputPath}/master.m3u8`;

  const video = await videoModel.create({
    title,
    description,
    course,
    uuid: vId,
    manifestFile: videoUrl,
  });

  selectedCourse.visible = true;
  await selectedCourse.save();

  res.json({
    message: "video is converting to hls format",
    videoUrl,
    videoId: vId,
    taskId: job.id,
    video,
  });
});

const checkJobStatus = async (jobId) => {
  const job = await videoQueue.getJob(jobId);

  if (!job) {
    return { error: true, message: "job not found" };
  }

  // Check the status of the job
  const state = await job.getState();

  if (state === "completed") {
    return { error: false, state: state, returnValue: job.returnvalue };
  } else if (state === "failed") {
    return { error: true, state: state, failedReason: job.failedReason, job };
  }
  return { error: false, state: state, jobdesc: job };
};

const checkProgress = asyncHandler(async (req, res) => {
  const taskId = req.query.taskId;
  const status = await checkJobStatus(taskId);
  res.json(status);
});

const getVideo = asyncHandler(async (req, res) => {
  const courseId = req.query.courseId;
  const course = await courseModel.findOne({_id: courseId},{textVectors: 0 }).populate([
    {
      path: "category",
      select: "name",
    },
    {
      path: "creator",
      select: "username fullname email profilePic"
    }
  ]);

  // let videos = await videoModel.find({ course: courseId }).lean();

  // const videoIds = videos.map(video=> video._id);
  // let likes = await likeModel.find({liked_by: req.user._id, like_on_ref: {$in: videoIds }},{like_on_ref: 1 });
  // likes = likes.map(like=>like.like_on_ref.toString())

  // videos = videos.map(video=> {
  //   return {...video, liked: likes.includes(video._id.toString()) }
  // });

  const videos = await videoModel.aggregate([
    {$match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $lookup: {
        from: 'likes', // Collection name for likes
        localField: '_id', // Field in videoModel
        foreignField: 'like_on_ref', // Field in likeModel
        as: 'liked_temp', // Name of the resulting array
      },
    },
    {
      $addFields: {
        liked: {
          $in: [new mongoose.Types.ObjectId(req.user._id), { $map: { input: '$liked_temp', as: 'like', in: '$$like.liked_by' } }],
        },
      },
    },
    { $project: { liked_temp: 0 } }, // Exclude the `likes` array from the result
  ]);

  
  res.json(new ApiResponse(200, "video", {course, videos}));
});


const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  const video = await videoModel.findOne({
    _id: videoId,
    uploader: req.user._id
  });

  if (!video)
    throw new ApiError(404, 'VIdeo Does not exists or already delted');

  if (!video.uploader.equals(req.user._id))
    throw new ApiError(403, 'Not your video to delete!!!');

  await video.delete();

  fs.rm(
    `uploads/videos/${video.uuid}`,
    { recursive: true, force: true },
    (err) => {}
  );
});

export { handleVideoUpload, checkProgress, getVideo, deleteVideo };
