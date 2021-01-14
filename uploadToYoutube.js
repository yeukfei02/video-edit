const fs = require("fs");
const { google } = require("googleapis");
const Youtube = require("youtube-api");
const readJson = require("r-json");
const Lien = require("lien");
const Logger = require("bug-killer");
const opn = require("opn");
const prettyBytes = require("pretty-bytes");

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

// read youtube stat
getChannelStatus();
getChannelVideoList();

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
