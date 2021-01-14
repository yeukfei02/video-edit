const env = require("dotenv");
env.config();

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");

const { getVideoDurationInSeconds } = require("get-video-duration");
const moment = require("moment");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const inputDir = "./inputFile";
const outDir = "./outputFile";
if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir);
}
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

// inputFile
fs.readdirSync("./inputFile").forEach(async (file) => {
  console.log("file = ", file);

  const fileName = path.parse(file).name;
  const fileExtension = path.extname(file);
  console.log("fileName = ", fileName);
  console.log("fileExtension = ", fileExtension);

  if (fileExtension && fileExtension !== ".mp4") {
    await convertVideoFormat(file, fileName);
  }

  if (file && !file.includes(".DS_Store")) {
    await videoEdit(file);
  }
});

async function convertVideoFormat(file, fileName) {
  const inputFile = `./inputFile/${file}`;
  const outputFile = `./inputFile/${fileName}.mp4`;

  const result = ffmpeg(inputFile).outputOptions("-c copy").output(outputFile);
  if (result) {
    result.run();
  }

  console.log("convert video format done");
}

async function videoEdit(file) {
  const inputFile = `./inputFile/${file}`;

  const videoDuration = await getVideoDurationInSeconds(inputFile);
  console.log("videoDuration = ", videoDuration);

  const totalMinutes = Math.floor(videoDuration / 60);
  console.log("totalMinutes = ", totalMinutes);

  let timeList = [];
  const loopTimes = totalMinutes / 10;

  let item = moment().startOf("day");
  for (let index = 0; index < loopTimes; index++) {
    if (index > 0) {
      item = moment(item).add(10, "minutes");
    }

    timeList.push(moment(item).format("HH:mm:ss"));
  }
  console.log("timeList = ", timeList);

  // in second
  const duration = "600";

  for (let index = 0; index < timeList.length; index++) {
    const time = timeList[index];

    const formattedIndex = index + 1;
    const outputFile = `./outputFile/video-output-part${formattedIndex}.mp4`;

    const result = ffmpeg(inputFile)
      .setStartTime(time)
      .setDuration(duration)
      .outputOptions("-c copy")
      .output(outputFile)
      .run();

    if (result) {
      result.run();
    }

    console.log("conversion done");
  }
}
