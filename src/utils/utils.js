import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { promises as fs } from "fs";

const createDirIfNotExists = async (dirname) => {
  return new Promise(async (resolve) => {
    console.log("here");
    try {
      const exists = await fs.access(dirname, fs.constants.F_OK);
      console.log(exists);
    } catch (error) {
      if (error.code == "ENOENT") {
        // folder does not exists
        console.log("creating dir: ", dirname);
        await fs.mkdir(dirname, { recursive: true });
      }
    }
    resolve(1);
  });
};

const makeSegments = async (inputFile, outputDir, resolution) => {
  await createDirIfNotExists(outputDir);

  return new Promise((resolve, reject) => {
    let videoBitrate, audioBitrate;

    // Adjust bitrates based on resolution
    switch (resolution) {
      case "1080p":
        videoBitrate = "2500k";
        audioBitrate = "192k";
        break;
      case "720p":
        videoBitrate = "1500k";
        audioBitrate = "128k";
        break;
      case "480p":
        videoBitrate = "750k";
        audioBitrate = "96k";
        break;
      default:
        videoBitrate = "1500k";
        audioBitrate = "128k";
    }

    ffmpeg(inputFile)
      .output(path.join(outputDir, `${resolution}.m3u8`))
      .outputOptions([
        "-c:v libx264",
        "-c:a aac",
        "-b:v " + videoBitrate,
        "-b:a " + audioBitrate,
        "-f hls",
        "-hls_time 10",
        "-hls_list_size 0",
        "-hls_segment_filename",
        path.join(outputDir, `${resolution}_segment_%03d.ts`),
      ])
      .on("end", () => {
        // console.log('.');
        resolve("finished conversion and scaling", resolution);
      })
      .on("error", (err) => {
        console.error("An error occurred: " + err.message);
        reject(err.message);
      })
      .run();
  });
};

const getVideoResolution = (filePath) => {
  console.log(filePath);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const { width, height } =
        metadata.streams.find((stream) => stream.width && stream.height) || {};
      if (width && height) {
        console.log(width, height);
        resolve({ width, height });
      } else {
        reject("Resolution not found");
      }
    });
  });
};

/**
 *
 * @param {string[]} resolutions
 * @param {string} dirName
 * @returns {Promise<string>}
 */
const createMasterM3u8 = async (resolutions, dirName) => {
  const resolutionMapper = {
    "1080p": {
      res: "1920x1080",
      bandWidth: "2500000",
    },
    "720p": {
      res: "1280x720",
      bandWidth: "1500000",
    },
    "480p": {
      res: "640x480",
      bandWidth: "750000",
    },
  };

  return new Promise(async (resolve, reject) => {
    try {
      let masterContent = "#EXTM3U\n#EXT-X-INDEPENDENT-SEGMENTS\n";
      let i = 1;
      for (let resolution of resolutions) {
        masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${
          resolutionMapper[resolution].bandWidth
        },PROGRAM-ID=${i++},RESOLUTION=${
          resolutionMapper[resolution].res
        }\n${resolution}.m3u8\n`;
      }

      const file = await fs.writeFile(
        path.join(dirName, "master.m3u8"),
        masterContent
      );
      console.log(file);
      resolve("created master.m3u8");
    } catch (err) {
      reject(err.message);
    }
  });
};

/**
 *
 * @param {string} filePath
 * @returns {Promise<string[]>}
 */
const calculateDownScaleResolutions = async (filePath) => {
  const availableRes = [480, 720, 1080, 2160];
  const resolution = await getVideoResolution(filePath);
  console.log("----------------");

  if (resolution.height < availableRes[0]) {
    return [availableRes[0] + "p"];
  }

  const scaleResolutions = [];
  availableRes.forEach((res) => {
    if (resolution.height >= res) {
      scaleResolutions.push(`${res}p`);
    }
  });

  return scaleResolutions;
};

const main = async () => {
  // const res = await makeSegments("input.mp4", "list", "720p")
  // console.log(res)

  // const res1 = await makeSegments("input.mp4", "list", "480p")
  // console.log(res1)

  // const res2 = await createMasterM3u8(['720p', '480p'], "list")
  // console.log(res2)

  const res = await getVideoResolution(
    "/home/raseek/Pictures/sample_1280x720_surfing_with_audio.mp4"
  );
  console.log(res);
};

// main()
export {
  makeSegments,
  createMasterM3u8,
  createDirIfNotExists,
  getVideoResolution,
  calculateDownScaleResolutions,
};
