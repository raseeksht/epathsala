import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import { videoQueue } from "../utils/worker.js";
import path from "path";
import { fileURLToPath } from "url";
import { videoModel } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { courseModel } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";

const handleVideoUpload = asyncHandler(async (req, res) => {
  const { title, description, course } = req.body;
  const vId = uuidv4();
  const videoPath = req.file.path;
  console.log(course);
  const selectedCourse = await courseModel.findOne({ _id: course });
  console.log(selectedCourse);
  if (!selectedCourse) {
    throw new ApiError(404, "Course Does not Exists");
  }

  // console.log(req.user._id);
  // console.log(selectedCourse.creator);
  // console.log()
  if (!selectedCourse.creator.equals(req.user._id)) {
    throw new ApiError(403, "Cannot upload to this course.");
  }

  // return res.send(videoPath);
  const outputPath = `uploads/videos/${vId}`;
  const hlsPath = `${outputPath}/master.m3u8`;
  console.log(hlsPath);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const job = await videoQueue.add({
    videoPath: path.join(__dirname, "..", "..", videoPath),
    outputPath: outputPath,
  });
  //   console.log(job);

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
  const videos = await videoModel.find({ course: courseId });
  res.json(new ApiResponse(200, "video", videos));
});

export { handleVideoUpload, checkProgress, getVideo };
