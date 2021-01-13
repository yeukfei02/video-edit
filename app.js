const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require("fs");
const path = require("path");

const inputDir = "./inputFile";
const outDir = "./outputFile";
if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir);
}
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

fs.readdirSync("./inputFile").forEach(async (file) => {
  console.log("file = ", file);

  const fileName = path.parse(file).name;
  const extension = path.extname(file);
  console.log("fileName = ", fileName);
  console.log("extension = ", extension);

  if (extension && extension !== ".mp4") {
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

  const timeList = [
    "00:00:00",
    "00:10:00",
    "00:20:00",
    "00:30:00",
    "00:40:00",
    "00:50:00",
  ];

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
