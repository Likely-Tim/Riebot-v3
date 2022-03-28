const express = require("express");
const app = express();
const fetch = require("node-fetch");
const lineByLine = require('n-readlines');
const file = require("./helpers/file.js");

const SPOTID = process.env.SPOTIFY_ID;
const SPOTSECRET = process.env.SPOTIFY_SECRET;

app.use(express.json());
app.use(express.static('web'));

app.all("/", (request, response) => {
  response.sendFile(__dirname + "/web/index.html");
});

app.all("/docs", (request, response) => {
  response.sendFile(__dirname + "/docs/index.html");
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

app.get("/auth/accepted/spotify", (request, response) => {
  console.log(request.url);
  accept_spotify(request.query.code)
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log(error);
  });
  response.sendStatus(200);
});

app.all("*", (request, response) => {
  console.log(request.url)
  response.sendFile(__dirname + "/docs" + request.url);
});

async function accept_spotify(code) {
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "code": code, "redirect_uri": "http://ec2-18-144-165-99.us-west-1.compute.amazonaws.com:3000/auth/accepted/spotify", "grant_type": "authorization_code"};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  return response.json();
}

function keepAlive() {
  app.listen(3000, () => {
    console.log("Server is ready.");
  })
}

module.exports = keepAlive;