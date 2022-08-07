const express = require("express");
const app = express();
const file = require("./helpers/file.js");

// Routing
const arknights = require("./routes/arknights.js");
const auth = require("./routes/auth.js");

app.use(express.json());
app.use(express.static("web"));

app.use("/arknights", arknights);
app.use("/auth", auth);

app.all("/", (request, response) => {
  response.sendFile(__dirname + "/web/html/index.html");
});

app.all("/docs", (request, response) => {
  response.sendFile(__dirname + "/docs/index.html");
});

app.get("/buttons", (request, response) => {
  response.sendFile(__dirname + "/web/html/buttons.html");
});

app.get("/spotify", (request, response) => {
  response.sendFile(__dirname + "/web/html/spotify.html");
});

app.get("/youtube", (request, response) => {
  response.sendFile(__dirname + "/web/html/youtube.html");
});

app.get("/log", (request, response) => {
  response.sendFile(__dirname + "/web/html/log.html");
});

app.get("/spotify_data", (request, response) => {
  const fileArray = file.lineArray("./web/saved/spotify.txt");
  response.send({ id: fileArray });
});

app.get("/youtube_data", (request, response) => {
  const fileArray = file.lineArray("./web/saved/youtube.txt");
  response.send({ id: fileArray });
});

app.get("/log_data", (request, response) => {
  const fileArray = file.lineArray("./web/saved/command_log.txt");
  response.send({ log: fileArray });
});

app.all("*", (request, response) => {
  response.sendFile(__dirname + "/docs" + request.url);
});

function keepAlive() {
  app.listen(process.env.PORT || 3000, () => {
    console.log("Server is ready.");
  });
}

module.exports = keepAlive;
