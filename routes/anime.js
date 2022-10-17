const express = require("express");
const router = express.Router();
const path = require("path");
const anilist = require("../utils/anilist");

router.get("/show", async (request, response) => {
  response.sendFile(path.join(__dirname, "../web/html/anime-show.html"));
});

router.get("/current", async (request, response) => {
  const media = await anilist.getAnimeSeason("FALL", 2022);
  response.send({ media: media });
});

router.get("/airing", async (request, response) => {
  const startTime = request.query.start;
  const endTime = request.query.end;
  if (startTime && endTime) {
    const media = await anilist.getAnimeAiring(startTime, endTime);
    response.send({ media: media });
  } else {
    response.sendStatus(500);
  }
});

module.exports = router;
