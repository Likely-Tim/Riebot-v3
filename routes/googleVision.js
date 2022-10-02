const express = require("express");
const router = express.Router();
const path = require("path");

const dbGoogleVision = require("../databaseUtils/googleVision");

router.get("/", async (request, response) => {
  const page = request.query.page;
  if (page) {
    const entries = await dbGoogleVision.getAllTextExtraction(page);
    response.send({data: entries});
  } else {
    response.sendFile(path.join(__dirname, "../web/html/googleVision.html"));
  }
});

module.exports = router;
