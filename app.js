const env = require("dotenv");
env.config();

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");

const { getVideoDurationInSeconds } = require("get-video-duration");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const Youtube = require("youtube-api");
const readJson = require("r-json");
const Lien = require("lien");
const Logger = require("bug-killer");
const opn = require("opn");
const prettyBytes = require("pretty-bytes");

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

// read youtube stat
getChannelStatus();
getChannelVideoList();

// outputFile and upload video to youtube
const CREDENTIALS = readJson(`${__dirname}/client_secret.json`);
const server = new Lien({
  host: "localhost",
  port: 5000,
});

const oauth = Youtube.authenticate({
  type: "oauth",
  client_id: CREDENTIALS.web.client_id,
  client_secret: CREDENTIALS.web.client_secret,
  redirect_url: CREDENTIALS.web.redirect_uris[0],
});

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

opn(
  oauth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  })
);

server.addPage("/oauth2callback", (lien) => {
  Logger.log(
    "Trying to get the token using the following code = " + lien.query.code
  );
  oauth.getToken(lien.query.code, async (err, tokens) => {
    if (err) {
      lien.lien(err, 400);
      return Logger.log(err);
    }

    Logger.log("Got the tokens.");

    oauth.setCredentials(tokens);

    lien.end(
      "The video is being uploaded. Check out the logs in the terminal."
    );

    fs.readdirSync("./outputFile").forEach((file, i) => {
      console.log("file = ", file);

      const index = i + 1;
      uploadVideoToYoutube(file, index);
    });
  });
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

async function getChannelStatus() {
  const youtube = google.youtube("v3");
  const response = await youtube.channels.list({
    auth: process.env.YOUTUBE_API_KEY,
    part: "snippet,contentDetails,statistics",
    id: process.env.YOUTUBE_CHANNEL_ID,
  });
  if (response) {
    const responseData = response.data;
    console.log("responseData = ", responseData);
    const channels = responseData.items;
    if (channels) {
      console.log("youtube channel id = ", channels[0].id);
      console.log("title = ", channels[0].snippet.title);
      console.log("viewCount = ", channels[0].statistics.viewCount);
    }
  }
}

async function getChannelVideoList() {
  const youtube = google.youtube("v3");
  const response = await youtube.search.list({
    auth: process.env.YOUTUBE_API_KEY,
    part: "snippet",
    channelId: process.env.YOUTUBE_CHANNEL_ID,
    maxResults: 25,
  });
  if (response) {
    const responseData = response.data;
    console.log("responseData = ", responseData);

    const videoList = responseData.items;
    if (videoList) {
      videoList.forEach((video, i) => {
        const videoSnippet = video.snippet;
        console.log("video snippet = ", videoSnippet);
      });
    }
  }
}

function uploadVideoToYoutube(file, index) {
  const outputFile = `./outputFile/${file}`;

  const req = Youtube.videos.insert(
    {
      resource: {
        snippet: {
          title: `Minecraft gameplay - part ${index}`,
          description: `Minecraft gameplay - part ${index}`,
        },
        status: {
          privacyStatus: "public",
        },
      },
      part: "snippet,status",
      media: {
        body: fs.createReadStream(outputFile),
      },
    },
    (err, data) => {
      console.log("Done.");
      process.exit();
    }
  );
  console.log("req = ", req);

  setInterval(() => {
    Logger.log(
      `${prettyBytes(req.req.connection._bytesDispatched)} bytes uploaded.`
    );
  }, 250);
}
