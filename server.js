const express = require("express");
const app = express();
const lineByLine = require('n-readlines');

app.use(express.json());
app.use(express.static('web'))

app.all("/", (req, res) => {
  res.send("Bot is running!");
});

app.get("/spotify", (request, response) => {
  response.sendFile(__dirname + "/web/spotify.html");
});

app.get("/spotify_data", (request, response) => {
  const spotify_line = new lineByLine('./web/saved/spotify.txt');
  let line;
  let file_array = [];
  while(line = spotify_line.next()) {
    file_array.push(line.toString('ascii'));
  }
  response.send({ "id": file_array });
});

function keepAlive() {
  app.listen(3000, () => {
    console.log("Server is ready.");
  })
}

module.exports = keepAlive;