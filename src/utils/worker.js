import Queue from "bull";
// import {
//   calculateDownScaleResolutions,
//   createDirIfNotExists,
//   createMasterM3u8,
//   makeSegments,
// } from "./utils.js";
import "dotenv/config";
import {
  calculateDownScaleResolutions,
  createDirIfNotExists,
  createMasterM3u8,
  makeSegments,
} from "./utils.js";

const videoQueue = new Queue("video transcode", {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    db: process.env.REDIS_DB,
  },
});

videoQueue.process(async function (job) {
  return new Promise(async (resolve, reject) => {
    try {
      const { outputPath, videoPath } = job.data;
      console.log("this is the videopath", videoPath);

      await createDirIfNotExists(outputPath);
      console.log("************************");
      const resolutionsArr = await calculateDownScaleResolutions(videoPath);
      console.log("resolution Arrays: ", resolutionsArr);

      for (let i in resolutionsArr) {
        const result = await makeSegments(
          videoPath,
          outputPath,
          resolutionsArr[i]
        );
        const progress = Math.ceil(100 / (resolutionsArr.length - i));
        await job.progress(progress);
        console.log(result);
      }
      const a = await createMasterM3u8(resolutionsArr, outputPath);
      //   console.log(a);
      resolve("Video Processing Complete");
    } catch (error) {
      console.log("**********\n Video Processing Error\n****************");
      console.log(error.message);
      reject("Video Processing Error: ", error.message);
    }
  });
});

const main = async () => {
  const job = await videoQueue.getJob("14");
  console.log(job);
};
// main();
export { videoQueue };
