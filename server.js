const express = require("express");
const app = express();
const {logger} = require("./utils/logger");

// Routing
const auth = require("./routes/auth");
const logs = require("./routes/logs");

app.use(express.json());
app.use(express.static("web"));

app.use("/auth", auth);
app.use("/logs", logs);

app.all("/", (request, response) => {
  response.sendFile(__dirname + "/web/html/index.html");
});

app.all("/docs", (request, response) => {
  response.sendFile(__dirname + "/docs/index.html");
});

app.get("/spotify", (request, response) => {
  response.sendFile(__dirname + "/web/html/spotify.html");
});

app.get("/youtube", (request, response) => {
  response.sendFile(__dirname + "/web/html/youtube.html");
});

app.all("*", (request, response) => {
  response.sendFile(__dirname + "/docs" + request.url);
});

function initializeServer() {
  app.listen(process.env.PORT || 3000, () => {
    logger.info("Server initialized");
  });
}

module.exports = initializeServer;
