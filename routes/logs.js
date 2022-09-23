const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

router.get("/", async (request, response) => {
  response.sendFile(path.join(__dirname, "../web/html/logs.html"));
});

router.get("/currentLogs", async (request, response) => {
  let fileNames = fs.readdirSync(path.join(__dirname, "../logs/runtime"));
  let logNames = [];
  for (let i = 0; i < fileNames.length; i++) {
    if (fileNames[i].endsWith(".log")) {
      logNames.push(fileNames[i]);
    }
  }
  response.send({logNames: logNames});
});

router.get("/*", async (request, response) => {
  response.sendFile(path.join(__dirname, `../logs/runtime${request.path}`));
});

module.exports = router;
