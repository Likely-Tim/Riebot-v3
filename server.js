const express = require("express");
const app = express();
const lineByLine = require('n-readlines');
const file = require("./helpers/file.js");

app.use(express.json());
app.use(express.static('web'));

app.all("/", (request, response) => {
  response.sendFile(__dirname + "/web/index.html");
});

app.get("/spotify", (request, response) => {
  response.sendFile(__dirname + "/web/spotify.html");
});

app.get("/youtube", (request, response) => {
  response.sendFile(__dirname + "/web/youtube.html");
});

app.get("/log", (request, response) => {
  response.sendFile(__dirname + "/web/log.html");
});

app.get("/spotify_data", (request, response) => {
  let file_array = file.line_array("./web/saved/spotify.txt");
  response.send({ "id": file_array });
});

app.get("/youtube_data", (request, response) => {
  let file_array = file.line_array("./web/saved/youtube.txt");
  response.send({ "id": file_array });
});

app.get("/log_data", (request, response) => {
  let file_array = file.line_array("./web/saved/command_log.txt");
  response.send({ "log": file_array });
});

function keepAlive() {
  app.listen(3000, () => {
    console.log("Server is ready.");
  })
}

module.exports = keepAlive;