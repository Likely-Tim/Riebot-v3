const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Databases
const dbToken = require('../databaseHelpers/tokens.js');

const SPOTIFY_ID = process.env.SPOTIFY_ID;
const SPOTIFY_SECRET = process.env.SPOTIFY_SECRET;
const MAL_ID = process.env.MAL_ID;

router.get('/', (request, response) => {
    if (request.query.type == "mal") {
      const codeVerifier = generatePKCECodeVerifier();
      const state = generatePKCECodeVerifier();
      response.redirect(`https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${MAL_ID}&state=${state}&redirect_uri=http://44.242.76.174/auth/mal&code_challenge=${codeVerifier}&code_challenge_method=plain`);
    } else {
      response.redirect('/');
    }
})

router.get('/spotify', async (request, response) => {
    try {
        await spotifyAccepted(request.query.code);
        response.redirect('/?spotifySuccess=true');
    } catch (error) {
        console.log(error);
        response.redirect('/?spotifySuccess=false');
    }
});

router.get('/mal', async (request, response) => {
  console.log(request);
})

async function spotifyAccepted(code) {
  const url = 'https://accounts.spotify.com/api/token';
  const data = {client_id: SPOTIFY_ID, client_secret: SPOTIFY_SECRET, code, redirect_uri: 'http://44.242.76.174/auth/spotify', grant_type: 'authorization_code'};
  let response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams(data),
  });
  if (response.status != 200) {
    throw new Error(response.statusText);
  }
  response = await response.json();
  await dbToken.put("spotifyAccess", response.access_token);
  await dbToken.put("spotifyRefresh", response.refresh_token);
}

function generatePKCECodeVerifier() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = router;