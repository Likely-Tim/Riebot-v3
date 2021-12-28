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

async function accept_spotify(code) {
  let url = "https://accounts.spotify.com/api/token";
  let data = {"client_id": SPOTID, "client_secret": SPOTSECRET, "code": code, "redirect_uri": "https://riebot-v3.fhusion.repl.co/auth/accepted/spotify", "grant_type": "authorization_code"};
  let response = await fetch(url, {
      method: 'POST', 
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data)});
  return response.json();
}

app.get("/auth/accepted", (request, response) => {
  sendPostRequest_mal(request.query.code)
  .then((response) => {
    let access_token = response.access_token;
    let refresh_token = response.refresh_token;
    console.log(access_token);
    console.log(refresh_token);
  })
  .catch((error) => {
    console.log("Error:", error);
  });
  response.sendStatus(200);
});

function keepAlive() {
  app.listen(3000, () => {
    console.log("Server is ready.");
  })
}

module.exports = keepAlive;