const express = require("express");
const router = express.Router();
const path = require("path");

const dbTesseract = require("../databaseUtils/tesseract");

router.get("/", async (request, response) => {
  const page = request.query.page;
  if (page) {
    const entries = await dbTesseract.getAll(page);
    response.send({data: entries});
  } else {
    response.sendFile(path.join(__dirname, "../web/html/tesseract.html"));
  }
});

module.exports = router;
