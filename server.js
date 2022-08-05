const express = require('express');
const app = express();
const fetch = require('node-fetch');
const file = require('./helpers/file.js');
const CryptoJS = require('crypto-js');

// Database
const dbToken = require('./databaseHelpers/tokens.js');

// Routing
const arknights = require('./routes/arknights.js');

const SPOTID = process.env.SPOTIFY_ID;
const SPOTSECRET = process.env.SPOTIFY_SECRET;
const PASSWORD = process.env.PASSWORD;

const postgress = require('pg');
const database = new postgress.Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}});
database.connect();

app.use(express.json());
app.use(express.static('web'));

app.use('/arknights', arknights);

app.all('/', (request, response) => {
  response.sendFile(__dirname + '/web/html/index.html');
});

app.all('/docs', (request, response) => {
  response.sendFile(__dirname + '/docs/index.html');
});

app.get('/buttons', (request, response) => {
  response.sendFile(__dirname + '/web/html/buttons.html');
});

app.get('/spotify', (request, response) => {
  response.sendFile(__dirname + '/web/html/spotify.html');
});

app.get('/youtube', (request, response) => {
  response.sendFile(__dirname + '/web/html/youtube.html');
});

app.get('/log', (request, response) => {
  response.sendFile(__dirname + '/web/html/log.html');
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

app.get('/auth/spotify/', async (request, response) => {
  try {
    await spotifyAccepted(request.query.code);
    response.redirect('/?spotifySuccess=true');
  } catch (error) {
    console.log(error);
    response.redirect('/?spotifySuccess=false');
  }
});

app.all('*', (request, response) => {
  response.sendFile(__dirname + '/docs' + request.url);
});

async function spotifyAccepted(code) {
  const url = 'https://accounts.spotify.com/api/token';
  const data = {client_id: SPOTID, client_secret: SPOTSECRET, code, redirect_uri: 'http://44.242.76.174/auth/spotify/', grant_type: 'authorization_code'};
  let response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data),
  });
  response = await response.json();
  await dbToken.put("spotifyAccess", response.access_token);
  await dbToken.put("spotifyRefresh", response.refresh_token);
}

function keepAlive() {
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server is ready.');
  });
}

module.exports = keepAlive;
