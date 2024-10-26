import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import { videoQueue } from "../utils/worker.js";
import path from "path";
import { fileURLToPath } from "url";

const handleVideoUpload = asyncHandler(async (req, res) => {
  const vId = uuidv4();
  const videoPath = req.file.path;

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

  const videoUrl = `http://localhost:8000/${outputPath}/master.m3u8`;
  res.json({
    message: "video is converting to hls format",
    videoUrl,
    videoId: vId,
    taskId: job.id,
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

export { handleVideoUpload, checkProgress };
