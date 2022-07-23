const express = require('express');
const app = express();
const fetch = require('node-fetch');
const file = require('./helpers/file.js');
const CryptoJS = require('crypto-js');

const SPOTID = process.env.SPOTIFY_ID;
const SPOTSECRET = process.env.SPOTIFY_SECRET;
const PASSWORD = process.env.PASSWORD;

const postgress = require('pg');
const database = new postgress.Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
database.connect();

app.use(express.json());
app.use(express.static('web'));

app.all('/', (request, response) => {
  response.sendFile(__dirname + '/web/index.html');
});

app.all('/docs', (request, response) => {
  response.sendFile(__dirname + '/docs/index.html');
});

app.get('/buttons', (request, response) => {
  response.sendFile(__dirname + '/web/buttons.html');
});

app.get('/spotify', (request, response) => {
  response.sendFile(__dirname + '/web/spotify.html');
});

app.get('/youtube', (request, response) => {
  response.sendFile(__dirname + '/web/youtube.html');
});

app.get('/log', (request, response) => {
  response.sendFile(__dirname + '/web/log.html');
});

app.get('/spotify_data', (request, response) => {
  const fileArray = file.lineArray('./web/saved/spotify.txt');
  response.send({id: fileArray});
});

app.get('/youtube_data', (request, response) => {
  const fileArray = file.lineArray('./web/saved/youtube.txt');
  response.send({id: fileArray});
});

app.get('/log_data', (request, response) => {
  const fileArray = file.lineArray('./web/saved/command_log.txt');
  response.send({log: fileArray});
});

app.get('/auth/spotify', (request, response) => {
  spotifyAccepted(request.query.code)
      .then(() => {
        response.sendStatus(200);
      })
      .catch((error) => {
        console.log(error);
      });
});

app.all('*', (request, response) => {
  response.sendFile(__dirname + '/docs' + request.url);
});

async function spotifyAccepted(code) {
  const url = 'https://accounts.spotify.com/api/token';
  const data = {client_id: SPOTID, client_secret: SPOTSECRET, code, redirect_uri: 'https://riebot-v3.herokuapp.com/auth/spotify', grant_type: 'authorization_code'};
  let response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data),
  });
  response = await response.json();
  const accessTokenEncrypted = CryptoJS.AES.encrypt(response.access_token, PASSWORD).toString();
  const refreshTokenEncrypted = CryptoJS.AES.encrypt(response.refresh_token, PASSWORD).toString();
  await database.query(`INSERT INTO tokens VALUES ('spotifyAccess', '${accessTokenEncrypted}') ON CONFLICT (name) DO UPDATE SET token = EXCLUDED.token;`);
  await database.query(`INSERT INTO tokens VALUES ('spotifyRefresh', '${refreshTokenEncrypted}') ON CONFLICT (name) DO UPDATE SET token = EXCLUDED.token;`);
}

function keepAlive() {
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server is ready.');
  });
}

module.exports = keepAlive;
