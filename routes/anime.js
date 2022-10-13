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

module.exports = router;
